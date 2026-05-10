import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Calendar } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const imgUrl = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;

const NewsArticlePage = () => {
  const { newsId } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/news/${newsId}`)
      .then(res => setArticle(res.data))
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [newsId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-black pt-32 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-zinc-400 text-lg">Το άρθρο δεν βρέθηκε.</p>
          <Link to="/news" className="text-[#F5A623] mt-4 inline-flex items-center gap-2 hover:underline">
            <ArrowLeft size={14} /> Πίσω στα Νέα
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-black" data-testid="news-article-page">
      {/* Hero with banner */}
      {article.image_url && (
        <div className="relative h-72 md:h-[420px] overflow-hidden">
          <img src={imgUrl(article.image_url)} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>
      )}

      <div className={`max-w-3xl mx-auto px-6 ${article.image_url ? "-mt-32 relative z-10" : "pt-32"} pb-20`}>
        <Link to="/news" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] text-sm mb-8 transition-colors" data-testid="back-to-news">
          <ArrowLeft size={14} /> Πίσω στα Νέα
        </Link>

        {/* Header */}
        <div className="mb-8">
          <span className="badge badge-secondary mb-4">{article.category || "Νεα"}</span>
          <h1 className="font-['Bebas_Neue'] text-4xl md:text-6xl text-white tracking-wide leading-tight" data-testid="article-title">
            {article.title}
          </h1>
          {article.created_at && (
            <div className="flex items-center gap-2 text-zinc-500 text-sm mt-4">
              <Calendar size={14} /> {new Date(article.created_at).toLocaleDateString("el-GR", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          )}
          {article.excerpt && (
            <p className="text-zinc-300 text-lg mt-6 leading-relaxed border-l-2 border-[#F5A623] pl-4">
              {article.excerpt}
            </p>
          )}
        </div>

        {/* Markdown content */}
        <div className="news-article-content text-zinc-300 leading-relaxed" data-testid="article-content">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h2 className="font-['Bebas_Neue'] text-3xl md:text-4xl text-white mt-10 mb-3 tracking-wide" {...props} />,
              h2: ({ node, ...props }) => <h3 className="font-['Bebas_Neue'] text-2xl md:text-3xl text-white mt-8 mb-3 tracking-wide" {...props} />,
              h3: ({ node, ...props }) => <h4 className="font-['Bebas_Neue'] text-xl md:text-2xl text-[#F5A623] mt-6 mb-2 tracking-wide" {...props} />,
              p: ({ node, ...props }) => <p className="my-4 text-base md:text-lg" {...props} />,
              a: ({ node, href, ...props }) => (
                <a
                  href={href}
                  target={href?.startsWith("http") ? "_blank" : undefined}
                  rel={href?.startsWith("http") ? "noreferrer" : undefined}
                  className="text-[#F5A623] underline underline-offset-2 hover:no-underline"
                  {...props}
                />
              ),
              img: ({ node, src, alt, ...props }) => (
                <span className="block my-6 rounded-lg overflow-hidden border border-[#262626]">
                  <img src={imgUrl(src)} alt={alt || ""} className="w-full h-auto" loading="lazy" {...props} />
                  {alt && <span className="block text-xs text-zinc-500 px-3 py-2 bg-[#0a0a0a]">{alt}</span>}
                </span>
              ),
              ul: ({ node, ...props }) => <ul className="list-disc list-outside pl-6 my-4 space-y-2 marker:text-[#F5A623]" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal list-outside pl-6 my-4 space-y-2 marker:text-[#F5A623]" {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-[#F5A623] pl-5 italic text-zinc-300 my-6" {...props} />,
              code: ({ node, inline, ...props }) =>
                inline
                  ? <code className="px-1.5 py-0.5 bg-[#1a1a1a] rounded text-sm text-[#F5A623]" {...props} />
                  : <code className="block p-4 bg-[#0a0a0a] border border-[#1e1e1e] rounded my-4 text-sm overflow-x-auto" {...props} />,
              hr: () => <hr className="border-[#262626] my-8" />,
              strong: ({ node, ...props }) => <strong className="text-white font-semibold" {...props} />,
            }}
          >
            {article.content || ""}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
};

export default NewsArticlePage;
