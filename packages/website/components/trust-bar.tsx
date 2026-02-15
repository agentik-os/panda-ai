export function TrustBar() {
  return (
    <section className="border-y bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-sm text-muted-foreground mb-6">
          Trusted by developers building the future
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
          {/* Placeholder for company logos */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 w-32 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground"
            >
              Company {i}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
