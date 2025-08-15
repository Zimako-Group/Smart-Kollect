"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllTenants, createTenant, updateTenant, type Tenant } from "@/lib/tenant-service";
import { Plus, Edit, Shield, Users, Globe, Calendar, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function TenantsManagementPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    domain: "",
    status: "active" as "active" | "inactive" | "suspended",
    settings: {}
  });

  useEffect(() => {
    // Only load tenants in browser environment to avoid build-time issues
    if (typeof window !== 'undefined') {
      loadTenants();
    }
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await getAllTenants();
      setTenants(data);
    } catch (error) {
      console.error("Error loading tenants:", error);
      toast({
        title: "Error",
        description: "Failed to load tenants",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    try {
      const newTenant = await createTenant({
        name: formData.name,
        subdomain: formData.subdomain,
        domain: formData.domain || `${formData.subdomain}.smartkollect.co.za`,
        status: formData.status,
        settings: formData.settings
      });

      if (newTenant) {
        setTenants([newTenant, ...tenants]);
        setIsCreateDialogOpen(false);
        resetForm();
        toast({
          title: "Success",
          description: "Tenant created successfully"
        });
      }
    } catch (error) {
      console.error("Error creating tenant:", error);
      toast({
        title: "Error",
        description: "Failed to create tenant",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return;

    try {
      const updatedTenant = await updateTenant(selectedTenant.id, {
        name: formData.name,
        subdomain: formData.subdomain,
        domain: formData.domain,
        status: formData.status,
        settings: formData.settings
      });

      if (updatedTenant) {
        setTenants(tenants.map(t => t.id === updatedTenant.id ? updatedTenant : t));
        setIsEditDialogOpen(false);
        setSelectedTenant(null);
        resetForm();
        toast({
          title: "Success",
          description: "Tenant updated successfully"
        });
      }
    } catch (error) {
      console.error("Error updating tenant:", error);
      toast({
        title: "Error",
        description: "Failed to update tenant",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      subdomain: tenant.subdomain,
      domain: tenant.domain || "",
      status: tenant.status,
      settings: tenant.settings || {}
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      subdomain: "",
      domain: "",
      status: "active",
      settings: {}
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "inactive":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "suspended":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tenant Management</h1>
        <p className="text-muted-foreground">Manage multi-tenant organizations and their settings</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Tenants</CardTitle>
            <CardDescription>View and manage all tenant organizations</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Tenant</DialogTitle>
                <DialogDescription>
                  Add a new tenant organization to the platform
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Triple M Financial Services"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                    placeholder="e.g., triplem"
                  />
                  <p className="text-sm text-muted-foreground">
                    Will be accessible at {formData.subdomain || "[subdomain]"}.smartkollect.co.za
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTenant}>Create Tenant</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tenants...</div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tenants found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {tenant.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`https://${tenant.subdomain}.smartkollect.co.za`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {tenant.subdomain}.smartkollect.co.za
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(tenant.status)}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={isEditDialogOpen && selectedTenant?.id === tenant.id} onOpenChange={(open) => {
                        if (!open) {
                          setIsEditDialogOpen(false);
                          setSelectedTenant(null);
                          resetForm();
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(tenant)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Edit Tenant</DialogTitle>
                            <DialogDescription>
                              Update tenant organization settings
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="edit-name">Organization Name</Label>
                              <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-subdomain">Subdomain</Label>
                              <Input
                                id="edit-subdomain"
                                value={formData.subdomain}
                                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-status">Status</Label>
                              <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => {
                              setIsEditDialogOpen(false);
                              setSelectedTenant(null);
                              resetForm();
                            }}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateTenant}>Update Tenant</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tenant Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-muted-foreground">Organizations on platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.filter(t => t.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.filter(t => t.status === "suspended").length}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
