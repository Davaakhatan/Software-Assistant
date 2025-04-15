export async function GET() {
  return new Response(JSON.stringify({ message: "Fallback API route" }), {
    headers: { "Content-Type": "application/json" },
  })
}

export async function POST() {
  return new Response(JSON.stringify({ message: "Fallback API route" }), {
    headers: { "Content-Type": "application/json" },
  })
}
