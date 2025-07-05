'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Book, FileText, Database, Users, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface DocContent {
  title: string;
  content: string;
  icon: React.ReactNode;
  description: string;
}

export default function DocsPage() {
  const [currentDoc, setCurrentDoc] = useState<string>('readme');
  const [docContent, setDocContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const docs: Record<string, DocContent> = {
    readme: {
      title: 'Overview',
      content: '',
      icon: <Book className="h-5 w-5" />,
      description: 'App overview and quick start guide'
    },
    userGuide: {
      title: 'User Guide',
      content: '',
      icon: <Users className="h-5 w-5" />,
      description: 'Comprehensive guide for all users'
    },
    requirements: {
      title: 'Requirements',
      content: '',
      icon: <FileText className="h-5 w-5" />,
      description: 'System requirements and specifications'
    },
    database: {
      title: 'Database',
      content: '',
      icon: <Database className="h-5 w-5" />,
      description: 'Database design and documentation'
    }
  };

  useEffect(() => {
    loadDocContent(currentDoc);
  }, [currentDoc]);

  const loadDocContent = async (docName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/docs/${docName}.md`);
      if (response.ok) {
        const content = await response.text();
        setDocContent(content);
      } else {
        setDocContent('# Documentation Not Found\n\nThe requested documentation could not be loaded.');
      }
    } catch (error) {
      setDocContent('# Error Loading Documentation\n\nThere was an error loading the documentation.');
    }
    setLoading(false);
  };

  const handleDocChange = (docName: string) => {
    setCurrentDoc(docName);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-3xl font-bold">Documentation</h1>
          </div>
          <p className="text-muted-foreground">
            Complete documentation for the Release Management Checklist App
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(docs).map(([key, doc]) => (
                  <Button
                    key={key}
                    variant={currentDoc === key ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleDocChange(key)}
                  >
                    {doc.icon}
                    <span className="ml-2">{doc.title}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Getting Started</h4>
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handleDocChange('userGuide')}
                    >
                      First-time Setup
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handleDocChange('userGuide')}
                    >
                      Authentication
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Core Features</h4>
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handleDocChange('userGuide')}
                    >
                      Release Management
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handleDocChange('userGuide')}
                    >
                      Team Management
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handleDocChange('userGuide')}
                    >
                      Feature Tracking
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {docs[currentDoc].icon}
                    <div>
                      <CardTitle>{docs[currentDoc].title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {docs[currentDoc].description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">v1.0.0</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-3xl font-bold mb-6 text-foreground">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-2xl font-semibold mb-4 mt-8 text-foreground border-b pb-2">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">{children}</h3>
                        ),
                        h4: ({ children }) => (
                          <h4 className="text-lg font-medium mb-2 mt-4 text-foreground">{children}</h4>
                        ),
                        p: ({ children }) => (
                          <p className="mb-4 text-foreground leading-relaxed">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-4 space-y-1 text-foreground">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-foreground">{children}</li>
                        ),
                        code: ({ children, className }) => {
                          const isInline = !className;
                          if (isInline) {
                            return (
                              <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground">
                                {children}
                              </code>
                            );
                          }
                          return (
                            <code className="block bg-muted p-4 rounded-lg text-sm font-mono text-foreground overflow-x-auto">
                              {children}
                            </code>
                          );
                        },
                        pre: ({ children }) => (
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4">
                            {children}
                          </blockquote>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto mb-4">
                            <table className="w-full border-collapse border border-border">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border border-border px-4 py-2 bg-muted font-semibold text-left">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-border px-4 py-2">
                            {children}
                          </td>
                        ),
                        a: ({ href, children }) => {
                          const isExternal = href?.startsWith('http');
                          return (
                            <a
                              href={href}
                              className="text-primary hover:underline inline-flex items-center"
                              target={isExternal ? '_blank' : undefined}
                              rel={isExternal ? 'noopener noreferrer' : undefined}
                            >
                              {children}
                              {isExternal && <ExternalLink className="h-3 w-3 ml-1" />}
                            </a>
                          );
                        },
                        strong: ({ children }) => (
                          <strong className="font-semibold text-foreground">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-foreground">{children}</em>
                        ),
                      }}
                    >
                      {docContent}
                    </ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 