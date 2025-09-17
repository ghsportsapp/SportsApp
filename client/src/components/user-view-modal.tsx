import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { User } from "@shared/schema";

interface UserViewModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserViewModal({ user, isOpen, onClose }: UserViewModalProps) {
  if (!user) return null;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Full Name</Label>
            <p className="mt-1 text-sm text-gray-900">{user.fullName}</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Username</Label>
            <p className="mt-1 text-sm text-gray-900">{user.username}</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Email</Label>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Phone</Label>
            <p className="mt-1 text-sm text-gray-900">{user.phone}</p>
          </div>
          
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Date Joined</Label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(user.createdAt)}</p>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
