import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAllProfiles } from "@/hooks/queries/useAllProfiles";
import { Loader2 } from "lucide-react";

export default function AdminUsers() {
  const { data: profiles = [], isLoading: loading } = useAllProfiles();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Benutzerverwaltung
          </h1>
          <p className="text-muted-foreground">
            Alle registrierten Profile auf einen Blick.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil Liste</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UUID</TableHead>
                  <TableHead>Kanal Name</TableHead>
                  <TableHead>Vollständiger Name</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>YouTube ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell
                      className="font-mono text-xs text-muted-foreground"
                      title={profile.id}
                    >
                      {profile.id.substring(0, 12)}...
                    </TableCell>
                    <TableCell className="font-medium">
                      {profile.youtube_channel_title || (
                        <span className="text-muted-foreground italic text-xs">
                          Ohne Kanal
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {profile.full_name || (
                        <span className="italic text-xs">Fehlt</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {profile.is_admin ? (
                        <Badge variant="default">Admin</Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {profile.youtube_channel_id ? (
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {profile.youtube_channel_id}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          Fehlt
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {profiles.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      Keine Profile gefunden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
