import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-3 text-sm text-gray-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="mt-4 text-xl font-bold text-gray-900" {...props} />,
          h2: (props) => (
            <h2 className="mt-4 border-t border-gray-200 pt-4 text-lg font-semibold text-gray-900" {...props} />
          ),
          h3: (props) => <h3 className="mt-2 text-base font-semibold text-gray-900" {...props} />,
          p: (props) => <p className="leading-relaxed" {...props} />,
          ul: (props) => <ul className="ml-5 list-disc space-y-1" {...props} />,
          ol: (props) => <ol className="ml-5 list-decimal space-y-1" {...props} />,
          a: (props) => <a className="text-blue-600 underline" {...props} />,
          code: ({ className, ...props }) => {
            if (className) return <code className={className} {...props} />;
            return (
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-800" {...props} />
            );
          },
          pre: (props) => (
            <pre className="overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100" {...props} />
          ),
          table: (props) => (
            <div className="overflow-auto">
              <table className="w-full border-collapse text-left text-xs" {...props} />
            </div>
          ),
          th: (props) => (
            <th className="border border-gray-200 bg-gray-50 px-2 py-1 font-medium" {...props} />
          ),
          td: (props) => <td className="border border-gray-200 px-2 py-1" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
