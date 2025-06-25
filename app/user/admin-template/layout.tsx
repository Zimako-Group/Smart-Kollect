export default function AdminTemplateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex-1 flex-col p-6 md:flex">
      {children}
    </div>
  );
}
