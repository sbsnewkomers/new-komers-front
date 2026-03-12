"use client";

import * as React from "react";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { User, Mail, Shield, Edit2, Save, X, UserCircle } from "lucide-react";
import { updateProfile } from "@/lib/profileApi";

export default function ProfilePage() {
  const { user, refreshMe } = usePermissionsContext();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });

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

  const formatStatus = React.useCallback((status?: string) => {
    if (!status) return "Actif";
    const statusMap: Record<string, string> = {
      "ACTIVE": "Actif",
      "INACTIVE": "Inactif", 
      "PENDING": "En attente",
      "SUSPENDED": "Suspendu"
    };
    return statusMap[status] || status;
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
    <AppLayout title="Mon Profil">
      <div className="h-screen flex items-center justify-center p-16">
        {/* Profile Card - All-in-One */}
        <Card className="border-0 shadow-sm w-full max-h-[75vh] overflow-hidden">
          <CardContent className="p-8 flex items-center justify-center h-full">
            <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl overflow-y-auto">
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
                <div className="flex items-center justify-between">
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
                    <div className="space-y-2">
                      <Label>Rôle</Label>
                      <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                        {formatRole(user.role)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <div className="px-3 py-2 bg-muted rounded-md text-sm">
                        {formatStatus(user.status)}
                      </div>
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
                    <div className="space-y-2">
                      <Label>Rôle</Label>
                      <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                        {formatRole(user.role)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <div className="px-3 py-2 bg-muted rounded-md text-sm">
                        {formatStatus(user.status)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
