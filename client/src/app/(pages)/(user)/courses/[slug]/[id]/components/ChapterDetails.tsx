import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChapterDataNew } from "@/type"
import { BookOpen, Calendar } from "lucide-react"

interface ChapterDetailsProps {
  chapter: ChapterDataNew | null
}

const ChapterDetails: React.FC<ChapterDetailsProps> = ({ chapter }) => {
  if (!chapter) return null

  return (
    <Card className="bg-gradient-to-br from-white to-red-50/30 overflow-hidden transition-all duration-300 group mx-auto relative shadow-lg">
      <CardHeader className="bg-gradient-to-r from-red-100/50 to-red-50/30 border-b border-red-100 py-8 px-8 font-plus-jakarta-sans">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-6 h-6 text-red-600" />
          <span className="text-sm font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full">
            Chapter {chapter.position || "1"}
          </span>
        </div>
        <CardTitle className="text-xl md:text-2xl font-bold text-gray-800 group-hover:text-red-700 transition-colors duration-300 leading-tight">
          {chapter.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <p className="text-gray-700 leading-relaxed text-base font-inter">{chapter.description}</p>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(chapter.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ChapterDetails

