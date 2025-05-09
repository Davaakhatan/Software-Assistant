// Add a routes file to ensure consistent route handling
export const routes = {
  testing: {
    index: "/testing",
    detail: (id: string) => `/testing/${id}`,
    saved: "/testing/saved",
  },
}
