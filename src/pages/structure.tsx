import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useGroups, useCompanies, useBusinessUnits } from "@/hooks";

export default function StructurePage() {
  const groups = useGroups();
  const companies = useCompanies();
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const businessUnits = useBusinessUnits(selectedCompanyId);

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showBUForm, setShowBUForm] = useState(false);

  const [groupForm, setGroupForm] = useState({
    name: "",
    fiscal_year_start: "2025-01-01",
    fiscal_year_end: "2025-12-31",
    siret: "",
    mainActivity: "",
  });
  const [companyForm, setCompanyForm] = useState({
    groupId: "",
    name: "",
    fiscal_year_start: "2025-01-01",
    fiscal_year_end: "2025-12-31",
    siret: "",
    address: "",
  });
  const [buForm, setBUForm] = useState({ name: "", code: "", activity: "", siret: "" });

  useEffect(() => {
    groups.fetchList();
  }, []);
  useEffect(() => {
    companies.fetchList();
  }, []);
  useEffect(() => {
    if (selectedGroupId) companies.fetchListByGroup(selectedGroupId);
    else companies.fetchList();
  }, [selectedGroupId]);
  useEffect(() => {
    if (selectedCompanyId) businessUnits.fetchList();
  }, [selectedCompanyId]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    await groups.create({
      name: groupForm.name,
      fiscal_year_start: groupForm.fiscal_year_start,
      fiscal_year_end: groupForm.fiscal_year_end,
      siret: groupForm.siret,
      mainActivity: groupForm.mainActivity || undefined,
    });
    setGroupForm({ name: "", fiscal_year_start: "2025-01-01", fiscal_year_end: "2025-12-31", siret: "", mainActivity: "" });
    setShowGroupForm(false);
  };
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.groupId) return;
    await companies.create({
      groupId: companyForm.groupId,
      name: companyForm.name,
      fiscal_year_start: companyForm.fiscal_year_start,
      fiscal_year_end: companyForm.fiscal_year_end,
      siret: companyForm.siret,
      address: companyForm.address || undefined,
    });
    setCompanyForm({ groupId: "", name: "", fiscal_year_start: "2025-01-01", fiscal_year_end: "2025-12-31", siret: "", address: "" });
    setShowCompanyForm(false);
    companies.fetchList();
  };
  const handleCreateBU = async (e: React.FormEvent) => {
    e.preventDefault();
    await businessUnits.create(buForm);
    setBUForm({ name: "", code: "", activity: "", siret: "" });
    setShowBUForm(false);
  };

  const handleUpdateGroup = async (id: string) => {
    const g = groups.list?.find((x) => x.id === id);
    if (!g) return;
    const name = prompt("Nom", g.name);
    if (name == null) return;
    await groups.update(id, { name });
  };
  const handleUpdateCompany = async (id: string) => {
    const c = companies.list?.find((x) => x.id === id);
    if (!c) return;
    const name = prompt("Nom", c.name);
    if (name == null) return;
    await companies.update(id, { name });
  };
  const handleUpdateBU = async (id: string) => {
    const b = businessUnits.list?.find((x) => x.id === id);
    if (!b) return;
    const name = prompt("Nom", b.name);
    if (name == null) return;
    await businessUnits.update(id, { name });
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Supprimer ce groupe ?")) return;
    await groups.remove(id);
  };
  const handleDeleteCompany = async (id: string) => {
    if (!confirm("Supprimer cette entreprise ?")) return;
    await companies.remove(id);
  };
  const handleDeleteBU = async (id: string) => {
    if (!confirm("Supprimer cette business unit ?")) return;
    await businessUnits.remove(id);
  };

  const loading = groups.loading || companies.loading || businessUnits.loading;

  return (
    <>
      <Head>
        <title>Structure — Groupes, Entreprises, BU</title>
      </Head>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Structure
            </h1>
            <Link
              href="/"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Accueil
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-4xl space-y-8 p-6">
          {/* --- Groupes --- */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Groupes
              </h2>
              <button
                type="button"
                onClick={() => groups.fetchList()}
                disabled={loading}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Charger
              </button>
              <button
                type="button"
                onClick={() => setShowGroupForm((v) => !v)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              >
                {showGroupForm ? "Annuler" : "Ajouter un groupe"}
              </button>
            </div>
            {showGroupForm && (
              <form onSubmit={handleCreateGroup} className="mb-4 grid gap-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                <input
                  required
                  placeholder="Nom"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  required
                  type="date"
                  value={groupForm.fiscal_year_start}
                  onChange={(e) => setGroupForm((f) => ({ ...f, fiscal_year_start: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  required
                  type="date"
                  value={groupForm.fiscal_year_end}
                  onChange={(e) => setGroupForm((f) => ({ ...f, fiscal_year_end: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  required
                  placeholder="SIRET (14 chiffres)"
                  maxLength={14}
                  value={groupForm.siret}
                  onChange={(e) => setGroupForm((f) => ({ ...f, siret: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  placeholder="Activité principale"
                  value={groupForm.mainActivity}
                  onChange={(e) => setGroupForm((f) => ({ ...f, mainActivity: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <button type="submit" className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700">
                  Créer
                </button>
              </form>
            )}
            {groups.error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{groups.error}</p>}
            <ul className="space-y-2">
              {groups.list?.map((g) => (
                <li
                  key={g.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 py-2 px-3 dark:border-zinc-600"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{g.name}</span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{g.siret}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateGroup(g.id)}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(g.id)}
                      className="rounded border border-red-400 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
              {groups.list?.length === 0 && !groups.loading && (
                <li className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">Aucun groupe</li>
              )}
            </ul>
          </section>

          {/* --- Entreprises --- */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Entreprises
              </h2>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              >
                <option value="">Tous les groupes</option>
                {groups.list?.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => selectedGroupId ? companies.fetchListByGroup(selectedGroupId) : companies.fetchList()}
                disabled={loading}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Charger
              </button>
              <button
                type="button"
                onClick={() => setShowCompanyForm((v) => !v)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              >
                {showCompanyForm ? "Annuler" : "Ajouter une entreprise"}
              </button>
            </div>
            {showCompanyForm && (
              <form onSubmit={handleCreateCompany} className="mb-4 grid gap-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                <select
                  required
                  value={companyForm.groupId}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, groupId: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="">Choisir un groupe</option>
                  {groups.list?.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <input
                  required
                  placeholder="Nom"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  required
                  type="date"
                  value={companyForm.fiscal_year_start}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, fiscal_year_start: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  required
                  type="date"
                  value={companyForm.fiscal_year_end}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, fiscal_year_end: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  required
                  placeholder="SIRET"
                  value={companyForm.siret}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, siret: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  placeholder="Adresse"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, address: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <button type="submit" className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700">
                  Créer
                </button>
              </form>
            )}
            {companies.error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{companies.error}</p>}
            <ul className="space-y-2">
              {companies.list?.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 py-2 px-3 dark:border-zinc-600"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{c.name}</span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{c.siret}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateCompany(c.id)}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCompany(c.id)}
                      className="rounded border border-red-400 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
              {companies.list?.length === 0 && !companies.loading && (
                <li className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">Aucune entreprise</li>
              )}
            </ul>
          </section>

          {/* --- Business Units --- */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Business Units
              </h2>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              >
                <option value="">Choisir une entreprise</option>
                {companies.list?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {selectedCompanyId && (
                <>
                  <button
                    type="button"
                    onClick={() => businessUnits.fetchList()}
                    disabled={loading}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Charger
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBUForm((v) => !v)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                  >
                    {showBUForm ? "Annuler" : "Ajouter une BU"}
                  </button>
                </>
              )}
            </div>
            {showBUForm && selectedCompanyId && (
              <form onSubmit={handleCreateBU} className="mb-4 grid gap-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                <input
                  required
                  placeholder="Nom"
                  value={buForm.name}
                  onChange={(e) => setBUForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  required
                  placeholder="Code"
                  value={buForm.code}
                  onChange={(e) => setBUForm((f) => ({ ...f, code: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  required
                  placeholder="Activité"
                  value={buForm.activity}
                  onChange={(e) => setBUForm((f) => ({ ...f, activity: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <input
                  required
                  placeholder="SIRET (14 chiffres)"
                  maxLength={14}
                  value={buForm.siret}
                  onChange={(e) => setBUForm((f) => ({ ...f, siret: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <button type="submit" className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700">
                  Créer
                </button>
              </form>
            )}
            {businessUnits.error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{businessUnits.error}</p>}
            {!selectedCompanyId && (
              <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Sélectionnez une entreprise pour afficher ses business units.
              </p>
            )}
            {selectedCompanyId && (
              <ul className="space-y-2">
                {businessUnits.list?.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 py-2 px-3 dark:border-zinc-600"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{b.name}</span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">{b.code} — {b.siret}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateBU(b.id)}
                        className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBU(b.id)}
                        className="rounded border border-red-400 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        Supprimer
                      </button>
                    </div>
                  </li>
                ))}
                {businessUnits.list?.length === 0 && !businessUnits.loading && (
                  <li className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">Aucune business unit</li>
                )}
              </ul>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
