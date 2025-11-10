export default function PageCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex justify-center items-center h-[calc(100vh-4rem)] bg-gray-100">
      <div className="w-full max-w-5xl bg-white shadow-md rounded-lg p-4">
        {children}
      </div>
    </main>
  );
} 
