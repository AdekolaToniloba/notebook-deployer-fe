"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Search,
  Shield,
  ShieldOff,
  Ban,
  CheckCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { adminService } from "@/lib/api/services/admin.service";
import { toasts } from "@/lib/toast-utils";
import type { AdminUser } from "@/types/api/admin.types";

export function UserManagementTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    try {
      const data = await adminService.listUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      toasts.general.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Actions
  const toggleSuperuser = async (user: AdminUser) => {
    try {
      await adminService.updateUser(user.id, {
        is_superuser: !user.is_superuser,
      });
      toasts.general.success(`User ${user.username} updated`);
      fetchUsers();
    } catch (err) {
      toasts.general.error("Update failed");
    }
  };

  const toggleActive = async (user: AdminUser) => {
    try {
      await adminService.updateUser(user.id, { is_active: !user.is_active });
      toasts.general.success(
        `User ${user.username} ${user.is_active ? "deactivated" : "activated"}`
      );
      fetchUsers();
    } catch (err) {
      toasts.general.error("Update failed");
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm("Are you sure? This is irreversible.")) return;
    try {
      await adminService.deleteUser(userId);
      toasts.general.success("User deleted");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      toasts.general.error("Delete failed");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="SEARCH USERS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-2 border-black rounded-none font-mono font-bold focus:ring-0 focus:bg-gray-50"
          />
        </div>
        <div className="font-mono font-bold text-sm bg-gray-100 px-3 py-2 border-2 border-black">
          TOTAL: {users.length}
        </div>
      </div>

      {/* Table */}
      <div className="border-2 border-black overflow-hidden">
        <Table>
          <TableHeader className="bg-black">
            <TableRow className="hover:bg-black border-b-2 border-black">
              <TableHead className="text-white font-black uppercase">
                User
              </TableHead>
              <TableHead className="text-white font-black uppercase">
                Role
              </TableHead>
              <TableHead className="text-white font-black uppercase">
                Status
              </TableHead>
              <TableHead className="text-white font-black uppercase text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow
                key={user.id}
                className="border-b-2 border-black/10 hover:bg-yellow-50 transition-colors font-mono"
              >
                <TableCell>
                  <div>
                    <p className="font-bold text-base">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {user.is_superuser ? (
                    <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 border border-purple-700 px-2 py-0.5 text-xs font-bold uppercase">
                      <Shield className="h-3 w-3" /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 border border-gray-500 px-2 py-0.5 text-xs font-bold uppercase">
                      User
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {user.is_active ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs uppercase">
                      <CheckCircle className="h-4 w-4" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs uppercase">
                      <Ban className="h-4 w-4" /> Banned
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 border-2 border-transparent hover:border-black rounded-none"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <DropdownMenuItem
                        onClick={() => toggleSuperuser(user)}
                        className="font-mono font-bold focus:bg-purple-100 cursor-pointer"
                      >
                        {user.is_superuser ? (
                          <>
                            <ShieldOff className="mr-2 h-4 w-4" /> Revoke Admin
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" /> Make Admin
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleActive(user)}
                        className="font-mono font-bold focus:bg-yellow-100 cursor-pointer"
                      >
                        {user.is_active ? (
                          <>
                            <Ban className="mr-2 h-4 w-4" /> Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" /> Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 font-mono font-bold focus:bg-red-100 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
