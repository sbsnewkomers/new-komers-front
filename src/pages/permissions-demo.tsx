import { useState } from "react";
import { usePermissions } from "@/permissions/usePermissions";
import { CRUD_ACTION, PermissionAction } from "@/permissions/actions";

type Item = { id: string; name: string };

export default function PermissionsDemoPage() {
  const { user, role, grants, can, cannot, setGrants, refreshMe } =
    usePermissions();
  const [items, setItems] = useState<Item[]>([
    { id: "1", name: "Projet A" },
    { id: "2", name: "Projet B" },
  ]);
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    if (cannot("companies", CRUD_ACTION.CREATE)) return;
    if (!newName.trim()) return;
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newName.trim() },
    ]);
    setNewName("");
  };

  const handleDelete = (id: string) => {
    if (cannot("companies", CRUD_ACTION.DELETE)) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleRename = (id: string) => {
    if (cannot("companies", CRUD_ACTION.UPDATE)) return;
    const name = prompt("Nouveau nom ?");
    if (!name) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name } : i)));
  };

  const loadDemoGrants = () => {
    // Simule des permissions pour tester le hook/HOC
    setGrants([
      { nodeType: "COMPANY", action: PermissionAction.READ_ALL },
      { nodeType: "COMPANY", action: PermissionAction.CREATE },
      { nodeType: "COMPANY", action: PermissionAction.UPDATE },
      // supprimez cette ligne pour tester un utilisateur sans DELETE
      { nodeType: "COMPANY", action: PermissionAction.DELETE },
    ]);
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-zinc-900">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Demo permissions / CRUD
          </h1>
          <button
            type="button"
            onClick={() => refreshMe()}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Recharger /auth/me
          </button>
        </header>

        <section className="mb-6 rounded-lg bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
          <p className="mb-1 text-zinc-700 dark:text-zinc-200">
            Utilisateur :{" "}
            {user ? (
              <>
                <strong>{user.email}</strong> ({role})
              </>
            ) : (
              <span className="italic text-zinc-500">non connecté</span>
            )}
          </p>
          <p className="mb-2 text-zinc-600 dark:text-zinc-400">
            Peut créer une société ?{" "}
            <strong>
              {can("companies", CRUD_ACTION.CREATE) ? "OUI" : "NON"}
            </strong>
          </p>
          <button
            type="button"
            onClick={loadDemoGrants}
            className="rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
          >
            Charger des permissions de démonstration
          </button>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Projets (CRUD en mémoire, contrôlé par permissions sur `companies`)
          </h2>

          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom du projet"
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={cannot("companies", CRUD_ACTION.CREATE)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Créer
            </button>
          </div>

          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
              >
                <span className="text-zinc-800 dark:text-zinc-100">
                  {item.name}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRename(item.id)}
                    disabled={cannot("companies", CRUD_ACTION.UPDATE)}
                    className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    Renommer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={cannot("companies", CRUD_ACTION.DELETE)}
                    className="rounded-md border border-red-400 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
