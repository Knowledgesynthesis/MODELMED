import React, { useState } from 'react';
import { ArrowLeft, Search, BookMarked } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { glossaryTerms, searchTerms } from '@/data/glossary/terms';

export const GlossaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  const filteredTerms = searchQuery
    ? searchTerms(searchQuery)
    : glossaryTerms;

  const selectedTermData = selectedTerm
    ? glossaryTerms.find(t => t.id === selectedTerm)
    : null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Glossary</h1>
          <p className="text-muted-foreground">
            Essential terms and concepts in predictive modeling
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Terms List */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">
            {filteredTerms.length} {filteredTerms.length === 1 ? 'Term' : 'Terms'}
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
            {filteredTerms.map((term) => (
              <Card
                key={term.id}
                className={`cursor-pointer transition-colors ${
                  selectedTerm === term.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedTerm(term.id)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{term.term}</CardTitle>
                      {term.moduleId && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {term.moduleId}
                        </Badge>
                      )}
                    </div>
                    <BookMarked className="h-4 w-4 text-muted-foreground ml-2" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Term Detail */}
        <div className="sticky top-24">
          {selectedTermData ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{selectedTermData.term}</CardTitle>
                {selectedTermData.moduleId && (
                  <Badge
                    variant="outline"
                    className="w-fit cursor-pointer"
                    onClick={() => navigate(`/module/${selectedTermData.moduleId}`)}
                  >
                    {selectedTermData.moduleId}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Definition</h4>
                  <p className="text-foreground/90">{selectedTermData.definition}</p>
                </div>

                {selectedTermData.example && (
                  <div>
                    <h4 className="font-semibold mb-2">Example</h4>
                    <p className="text-sm text-muted-foreground italic">
                      {selectedTermData.example}
                    </p>
                  </div>
                )}

                {selectedTermData.relatedTerms && selectedTermData.relatedTerms.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Related Terms</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTermData.relatedTerms.map((relatedId) => {
                        const relatedTerm = glossaryTerms.find(t => t.id === relatedId);
                        return relatedTerm ? (
                          <Badge
                            key={relatedId}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => setSelectedTerm(relatedId)}
                          >
                            {relatedTerm.term}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookMarked className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select a term to view its definition and related concepts
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
