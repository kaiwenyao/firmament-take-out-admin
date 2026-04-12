const NotFound = () => {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-2 text-muted-foreground">
      <p className="text-lg font-medium text-foreground">Page not found</p>
      <p className="text-sm">The page you requested does not exist.</p>
    </div>
  );
};

export default NotFound;
