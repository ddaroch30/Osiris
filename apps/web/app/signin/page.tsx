export default function SignIn() {
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="text-xl font-semibold">Sign in</h2>
      <p className="text-sm text-slate-600">Demo user: owner@demo.com / Password123!</p>
      <form className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="Email" />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password" />
        <button className="w-full bg-slate-900 text-white rounded py-2">Sign in</button>
      </form>
    </div>
  );
}
