#!/usr/bin/env python3
"""
Schema Organization Script

This script parses a PostgreSQL schema dump and organizes it into separate files:
- Tables with DDL, comments, foreign keys, indexes, triggers, and privileges
- Functions with DDL

Files are numbered to ensure proper dependency order for creation.
"""

import re
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Set

class SchemaOrganizer:
    def __init__(self, schema_file: str):
        self.schema_file = schema_file
        self.content = ""
        self.tables: Dict[str, Dict] = {}
        self.functions: Dict[str, Dict] = {}
        self.foreign_keys: Dict[str, List[str]] = {}
        self.dependencies: Dict[str, Set[str]] = {}
        
    def load_schema(self):
        """Load the schema file content."""
        with open(self.schema_file, 'r') as f:
            self.content = f.read()
    
    def extract_functions(self):
        """Extract function definitions from the schema."""
        # Pattern to match function definitions
        function_pattern = r'--\s*Name:\s*([^;]+);\s*Type:\s*FUNCTION;\s*Schema:\s*public;\s*Owner:\s*([^\n]+)\s*--\s*\n\n(.*?)(?=\n\n--\s*Name:\s*|$)'
        
        matches = re.finditer(function_pattern, self.content, re.DOTALL)
        
        for match in matches:
            function_name = match.group(1).strip()
            owner = match.group(2).strip()
            function_ddl = match.group(3).strip()
            
            # Clean up function name (remove quotes and schema)
            clean_name = function_name.replace('"public"."', '').replace('"', '')
            
            self.functions[clean_name] = {
                'name': clean_name,
                'owner': owner,
                'ddl': function_ddl
            }
    
    def extract_tables(self):
        """Extract table definitions and related objects."""
        # Find all table sections by looking for CREATE TABLE statements
        table_sections = re.findall(r'(CREATE TABLE IF NOT EXISTS "public"\."([^"]+)"[^;]+;.*?)(?=CREATE TABLE IF NOT EXISTS|$)', self.content, re.DOTALL)
        
        for table_content, table_name in table_sections:
            # Find the owner information
            owner_match = re.search(r'ALTER TABLE "public"\."([^"]+)" OWNER TO "([^"]+)";', table_content)
            owner = owner_match.group(2) if owner_match else "postgres"
            
            self.tables[table_name] = {
                'name': table_name,
                'owner': owner,
                'content': table_content,
                'ddl': '',
                'comments': [],
                'foreign_keys': [],
                'indexes': [],
                'triggers': [],
                'privileges': []
            }
            
            self.parse_table_content(table_name, table_content)
    
    def parse_table_content(self, table_name: str, content: str):
        """Parse table content to extract DDL, comments, constraints, etc."""
        table = self.tables[table_name]
        
        # Extract CREATE TABLE statement
        create_match = re.search(r'(CREATE TABLE IF NOT EXISTS[^;]+;)', content, re.DOTALL)
        if create_match:
            table['ddl'] = create_match.group(1).strip()
        
        # Extract comments for this table
        comment_pattern = r'COMMENT ON (?:TABLE|COLUMN)\s+"public"\."([^"]+)"(?:\."([^"]+)")?\s+IS\s+\'([^\']+)\';'
        comments = re.findall(comment_pattern, content)
        for comment in comments:
            if comment[0] == table_name:  # Only comments for this table
                if comment[1]:  # Column comment
                    table['comments'].append(f'COMMENT ON COLUMN "public"."{comment[0]}"."{comment[1]}" IS \'{comment[2]}\';')
                else:  # Table comment
                    table['comments'].append(f'COMMENT ON TABLE "public"."{comment[0]}" IS \'{comment[2]}\';')
    
    def extract_foreign_keys(self):
        """Extract all foreign key constraints from the schema."""
        fk_pattern = r'ALTER TABLE ONLY "public"\."([^"]+)"\s+ADD CONSTRAINT "([^"]+)" FOREIGN KEY \("([^"]+)"\) REFERENCES "public"\."([^"]+)"\("([^"]+)"\)[^;]*;'
        
        for match in re.finditer(fk_pattern, self.content):
            table_name = match.group(1)
            fk_name = match.group(2)
            fk_column = match.group(3)
            ref_table = match.group(4)
            ref_column = match.group(5)
            
            if table_name not in self.foreign_keys:
                self.foreign_keys[table_name] = []
            
            fk_statement = match.group(0)
            self.foreign_keys[table_name].append(fk_statement)
            
            # Add to table's foreign keys if it exists
            if table_name in self.tables:
                self.tables[table_name]['foreign_keys'].append(fk_statement)
            
            # Track dependencies
            if table_name not in self.dependencies:
                self.dependencies[table_name] = set()
            self.dependencies[table_name].add(ref_table)
    
    def extract_triggers(self):
        """Extract triggers for each table."""
        trigger_pattern = r'CREATE OR REPLACE TRIGGER "([^"]+)"\s+([^;]+);'
        
        for match in re.finditer(trigger_pattern, self.content):
            trigger_name = match.group(1)
            trigger_def = match.group(2)
            
            # Extract table name from trigger definition
            table_match = re.search(r'ON "public"\."([^"]+)"', trigger_def)
            if table_match:
                table_name = table_match.group(1)
                if table_name in self.tables:
                    self.tables[table_name]['triggers'].append(f'CREATE OR REPLACE TRIGGER "{trigger_name}" {trigger_def};')
    
    def extract_privileges(self):
        """Extract privileges for each table."""
        # Look for GRANT statements in the schema
        grant_pattern = r'GRANT[^;]+ON TABLE "public"\."([^"]+)"[^;]+;'
        
        for match in re.finditer(grant_pattern, self.content):
            table_name = match.group(1)
            grant_statement = match.group(0)
            
            if table_name in self.tables:
                self.tables[table_name]['privileges'].append(grant_statement)
    
    def calculate_dependencies(self):
        """Calculate table dependencies based on foreign keys."""
        for table_name in self.tables:
            if table_name not in self.dependencies:
                self.dependencies[table_name] = set()
            
            # Add foreign key dependencies
            if table_name in self.foreign_keys:
                for fk in self.foreign_keys[table_name]:
                    ref_match = re.search(r'REFERENCES "public"\."([^"]+)"', fk)
                    if ref_match:
                        ref_table = ref_match.group(1)
                        self.dependencies[table_name].add(ref_table)
    
    def topological_sort(self) -> List[str]:
        """Perform topological sort to determine creation order."""
        # Kahn's algorithm for topological sorting
        in_degree = {table: 0 for table in self.tables}
        
        # Calculate in-degrees
        for table in self.tables:
            for dep in self.dependencies.get(table, set()):
                if dep in in_degree:
                    in_degree[dep] += 1
        
        # Find nodes with no incoming edges
        queue = [table for table, degree in in_degree.items() if degree == 0]
        result = []
        
        while queue:
            current = queue.pop(0)
            result.append(current)
            
            # Reduce in-degree for all dependent tables
            for dep in self.dependencies.get(current, set()):
                if dep in in_degree:
                    in_degree[dep] -= 1
                    if in_degree[dep] == 0:
                        queue.append(dep)
        
        # Add any remaining tables (should be none if no cycles)
        for table in self.tables:
            if table not in result:
                result.append(table)
        
        return result
    
    def create_directories(self):
        """Create the necessary directories."""
        Path("database/schema/tables").mkdir(parents=True, exist_ok=True)
        Path("database/schema/functions").mkdir(parents=True, exist_ok=True)
    
    def write_table_files(self, table_order: List[str]):
        """Write individual table files."""
        for i, table_name in enumerate(table_order):
            if table_name not in self.tables:
                continue
                
            table = self.tables[table_name]
            filename = f"database/schema/tables/{i:02d}_{table_name}.sql"
            
            with open(filename, 'w') as f:
                f.write(f"-- Table: {table_name}\n")
                f.write(f"-- Owner: {table['owner']}\n")
                f.write("--\n\n")
                
                # Table DDL
                f.write("-- Table DDL\n")
                f.write("--\n")
                f.write(table['ddl'] + "\n\n")
                
                # Comments
                if table['comments']:
                    f.write("-- Comments\n")
                    f.write("--\n")
                    for comment in table['comments']:
                        f.write(comment + "\n")
                    f.write("\n")
                
                # Foreign Keys
                if table['foreign_keys']:
                    f.write("-- Foreign Keys\n")
                    f.write("--\n")
                    for fk in table['foreign_keys']:
                        f.write(fk + "\n")
                    f.write("\n")
                
                # Indexes (if any)
                if table['indexes']:
                    f.write("-- Indexes\n")
                    f.write("--\n")
                    for idx in table['indexes']:
                        f.write(idx + "\n")
                    f.write("\n")
                
                # Triggers
                if table['triggers']:
                    f.write("-- Triggers\n")
                    f.write("--\n")
                    for trigger in table['triggers']:
                        f.write(trigger + "\n")
                    f.write("\n")
                
                # Privileges
                if table['privileges']:
                    f.write("-- Privileges\n")
                    f.write("--\n")
                    for privilege in table['privileges']:
                        f.write(privilege + "\n")
                    f.write("\n")
    
    def write_function_files(self):
        """Write individual function files."""
        for i, (func_name, func_data) in enumerate(self.functions.items()):
            # Clean function name for filename
            clean_func_name = func_name.replace('(', '_').replace(')', '').replace(',', '_').replace(' ', '_')
            filename = f"database/schema/functions/{i:02d}_{clean_func_name}.sql"
            
            with open(filename, 'w') as f:
                f.write(f"-- Function: {func_name}\n")
                f.write(f"-- Owner: {func_data['owner']}\n")
                f.write("--\n\n")
                f.write(func_data['ddl'] + "\n\n")
    
    def write_creation_script(self, table_order: List[str]):
        """Write a script that creates everything in the correct order."""
        with open("database/schema/create_all.sql", 'w') as f:
            f.write("-- Schema Creation Script\n")
            f.write("-- This script creates all tables and functions in the correct order\n")
            f.write("--\n\n")
            
            # Functions first (they might be needed by triggers)
            f.write("-- Functions\n")
            f.write("--\n")
            for func_name in self.functions:
                clean_func_name = func_name.replace('(', '_').replace(')', '').replace(',', '_').replace(' ', '_')
                f.write(f"\\i functions/{clean_func_name}.sql\n")
            f.write("\n")
            
            # Tables in dependency order
            f.write("-- Tables\n")
            f.write("--\n")
            for table_name in table_order:
                f.write(f"\\i tables/{table_name}.sql\n")
            f.write("\n")
    
    def organize(self):
        """Main method to organize the schema."""
        print("Loading schema file...")
        self.load_schema()
        
        print("Extracting functions...")
        self.extract_functions()
        
        print("Extracting tables...")
        self.extract_tables()
        
        print("Extracting foreign keys...")
        self.extract_foreign_keys()
        
        print("Extracting triggers...")
        self.extract_triggers()
        
        print("Extracting privileges...")
        self.extract_privileges()
        
        print("Calculating dependencies...")
        self.calculate_dependencies()
        
        print("Performing topological sort...")
        table_order = self.topological_sort()
        
        print("Creating directories...")
        self.create_directories()
        
        print("Writing table files...")
        self.write_table_files(table_order)
        
        print("Writing function files...")
        self.write_function_files()
        
        print("Writing creation script...")
        self.write_creation_script(table_order)
        
        print(f"\nSchema organized successfully!")
        print(f"Tables: {len(self.tables)}")
        print(f"Functions: {len(self.functions)}")
        print(f"Table creation order: {', '.join(table_order)}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python organize_schema.py <schema_file>")
        sys.exit(1)
    
    schema_file = sys.argv[1]
    if not os.path.exists(schema_file):
        print(f"Schema file not found: {schema_file}")
        sys.exit(1)
    
    organizer = SchemaOrganizer(schema_file)
    organizer.organize()

if __name__ == "__main__":
    main() 