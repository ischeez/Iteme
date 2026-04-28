import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">Страница не найдена</h1>
      <p className="mt-2 text-sm text-slate-500">Похоже, ссылка устарела или введена с ошибкой.</p>
      <Link
        to="/feed"
        className="mt-4 inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
      >
        Вернуться в ленту
      </Link>
    </section>
  )
}
