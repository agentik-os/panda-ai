"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExamQuestionProps {
  questionNumber: number;
  section: string;
  question: string;
  options: string[];
  selectedIndex?: number;
  onSelect: (index: number) => void;
}

export function ExamQuestion({
  questionNumber,
  section,
  question,
  options,
  selectedIndex,
  onSelect,
}: ExamQuestionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-1 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {section}
          </Badge>
        </div>
        <CardTitle className="text-lg">
          Q{questionNumber}. {question}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${
                selectedIndex === index
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <span className="mr-2 font-medium">
                {String.fromCharCode(65 + index)})
              </span>
              {option}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
