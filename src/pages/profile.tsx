"use client";

import * as React from "react";
import Head from "next/head";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { User, Mail, Shield, Edit2, Save, X, UserCircle, Lock, Eye, EyeOff } from "lucide-react";
import { updateProfile, updatePassword } from "@/lib/profileApi";

export default function ProfilePage() {
  const { user, refreshMe } = usePermissionsContext();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [isSavingPassword, setIsSavingPassword] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  // Handler functions
  const handleEdit = React.useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = React.useCallback(async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      });

      // Rafraîchir les données utilisateur après la mise à jour
      await refreshMe({ silent: false });
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
    } finally {
      setIsSaving(false);
    }
  }, [formData, refreshMe]);

  const handleCancel = React.useCallback(() => {
    setIsEditing(false);
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    });
  }, [user]);

  const handleInputChange = React.useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Password validation
  const validatePassword = React.useCallback((password: string): string | null => {
    if (password.length < 12) {
      return "Le mot de passe doit contenir au moins 12 caractères";
    }
    if (!/[A-Z]/.test(password)) {
      return "Le mot de passe doit contenir au moins une lettre majuscule";
    }
    if (!/[a-z]/.test(password)) {
      return "Le mot de passe doit contenir au moins une lettre minuscule";
    }
    if (!/[0-9]/.test(password)) {
      return "Le mot de passe doit contenir au moins un chiffre";
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Le mot de passe doit contenir au moins un caractère spécial";
    }
    return null;
  }, []);

  const handlePasswordInputChange = React.useCallback((field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    setPasswordError(null);
  }, []);

  const handleSavePassword = React.useCallback(async () => {
    setPasswordError(null);

    // Validation
    if (!passwordData.currentPassword) {
      setPasswordError("Veuillez entrer votre mot de passe actuel");
      return;
    }

    const passwordValidationError = validatePassword(passwordData.newPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsSavingPassword(true);
    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      // Reset password form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      setPasswordError("Le mot de passe actuel est incorrect");
    } finally {
      setIsSavingPassword(false);
    }
  }, [passwordData, validatePassword]);

  const handleCancelPassword = React.useCallback(() => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordError(null);
  }, []);

  // Mettre à jour le formData lorsque les données utilisateur changent
  React.useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      });
    }
  }, [user]);

  // Formatter functions
  const formatRole = React.useCallback((role?: string) => {
    if (!role) return "USER";
    const roleMap: Record<string, string> = {
      "SUPER_ADMIN": "Super Admin",
      "ADMIN": "Administrateur",
      "MANAGER": "Manager",
      "END_USER": "Utilisateur"
    };
    return roleMap[role] || role;
  }, []);


  // Loading state
  if (!user) {
    return (
      <AppLayout title="Mon Profil">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Chargement du profil...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Mon Profil" companies={[]} selectedCompanyId="" onCompanyChange={() => { }}>
      <Head>
        <title>Mon Profil</title>
      </Head>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <UserCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Profil</h2>
              <p className="text-sm text-slate-500">Gérez vos informations personnelles et votre mot de passe.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Profile Card - Header + Personal Information */}
          <div className="border-b border-slate-100 bg-slate-50/60 p-6">
            <div className="flex flex-col lg:flex-row gap-8 w-full">
              {/* Profile Header Section */}
              <div className="flex flex-col items-center lg:items-start gap-4 lg:gap-6 flex-shrink-0">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center text-primary border-2 border-primary/20">
                    <UserCircle className="w-14 h-14" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background"></div>
                </div>
                <div className="text-center lg:text-left space-y-3">
                  <h1 className="text-2xl font-bold text-foreground">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email?.split('@')[0] || "Utilisateur"
                    }
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {user.email}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 justify-center lg:justify-start">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">{formatRole(user.role)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span className="text-sm">@{user.email?.split('@')[0] || "user"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="flex-1 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-xl font-semibold text-foreground">Informations personnelles</h3>
                  {!isEditing && (
                    <Button onClick={handleEdit} size="sm">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Adresse email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={user.email}
                          disabled
                          className="pl-10 bg-muted"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Adresse email</Label>
                      <div className="px-3 py-2 bg-muted rounded-md text-sm">
                        {user.email}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Prénom</Label>
                      <div className="px-3 py-2 bg-muted rounded-md text-sm">
                        {user.firstName || "Non renseigné"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <div className="px-3 py-2 bg-muted rounded-md text-sm">
                        {user.lastName || "Non renseigné"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row">
                    <Button onClick={handleSave} disabled={isSaving} className="flex w-full items-center gap-2 sm:w-auto">
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="flex w-full items-center gap-2 sm:w-auto">
                      <X className="w-4 h-4" />
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Mot de passe
                </h3>
                {!isChangingPassword && (
                  <Button onClick={() => setIsChangingPassword(true)} size="sm" variant="outline">
                    <Lock className="w-4 h-4 mr-2" />
                    Modifier le mot de passe
                  </Button>
                )}
              </div>

              {!isChangingPassword ? (
                <div className="text-sm text-muted-foreground">
                  Votre mot de passe a été défini. Vous pouvez le modifier en cliquant sur le bouton ci-dessus.
                </div>
              ) : (
                <div className="space-y-4">
                  {passwordError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
                      {passwordError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordInputChange("currentPassword", e.target.value)}
                        placeholder="Entrez votre mot de passe actuel"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordInputChange("newPassword", e.target.value)}
                        placeholder="Entrez le nouveau mot de passe"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Le mot de passe doit contenir :
                      <ul className="mt-1 ml-4 list-disc space-y-1">
                        <li>Au moins 12 caractères</li>
                        <li>Au moins une lettre majuscule</li>
                        <li>Au moins une lettre minuscule</li>
                        <li>Au moins un chiffre</li>
                        <li>Au moins un caractère spécial</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordInputChange("confirmPassword", e.target.value)}
                        placeholder="Confirmez le nouveau mot de passe"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row">
                    <Button onClick={handleSavePassword} disabled={isSavingPassword} className="flex w-full items-center gap-2 sm:w-auto">
                      <Save className="w-4 h-4" />
                      {isSavingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                    </Button>
                    <Button variant="outline" onClick={handleCancelPassword} className="flex w-full items-center gap-2 sm:w-auto">
                      <X className="w-4 h-4" />
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
