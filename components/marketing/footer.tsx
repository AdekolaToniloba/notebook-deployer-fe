import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t-2 border-black bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 border-2 border-black bg-[#B6DFF]" />
              <span className="font-mono text-xl font-bold uppercase">
                NotebookDeploy
              </span>
            </div>
            <p className="font-mono text-sm text-gray-600 max-w-xs">
              Turn your Jupyter Notebooks into production APIs in seconds. No
              config required.
            </p>
          </div>

          <div>
            <h3 className="font-mono font-bold uppercase mb-4 border-b-2 border-black inline-block">
              Product
            </h3>
            <ul className="space-y-2 font-mono text-sm">
              <li>
                <Link
                  href="/features"
                  className="hover:bg-black hover:text-white px-1 transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:bg-black hover:text-white px-1 transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="hover:bg-black hover:text-white px-1 transition-colors"
                >
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono font-bold uppercase mb-4 border-b-2 border-black inline-block">
              Connect
            </h3>
            <div className="flex gap-4">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="border-2 border-black p-2 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all bg-white"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 border-t-2 border-black pt-8 font-mono text-xs text-gray-500 flex justify-between">
          <p>&copy; 2025 NotebookDeploy Inc.</p>
          <p>BUILT FOR BUILDERS</p>
        </div>
      </div>
    </footer>
  );
}
