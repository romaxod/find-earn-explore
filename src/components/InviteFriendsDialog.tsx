import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InviteFriendsDialogProps {
  eventId: string;
  eventTitle: string;
}

export const InviteFriendsDialog = ({ eventId, eventTitle }: InviteFriendsDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (open) {
      checkAuth();
    }
  }, [open]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await fetchFriends(session.user.id);
    }
  };

  const fetchFriends = async (userId: string) => {
    setLoading(true);
    try {
      // Get accepted friend requests
      const { data: friendData, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender:sender_id(id, name, email),
          receiver:receiver_id(id, name, email)
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      
      if (error) throw error;
      
      // Map to get the friend's profile
      const friendsList = friendData?.map((req: any) => {
        return req.sender_id === userId ? req.receiver : req.sender;
      }) || [];
      
      // Check which friends already have invitations
      const { data: invitations, error: invError } = await supabase
        .from('event_invitations')
        .select('receiver_id')
        .eq('event_id', eventId)
        .eq('sender_id', userId);
      
      if (invError) throw invError;
      
      const invitedIds = new Set(invitations?.map(inv => inv.receiver_id) || []);
      
      // Filter out already invited friends
      const availableFriends = friendsList.filter(friend => !invitedIds.has(friend.id));
      
      setFriends(availableFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast({
        title: "Error",
        description: "Failed to load friends list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleSendInvitations = async () => {
    if (selectedFriends.size === 0 || !user) return;
    
    setSending(true);
    try {
      const invitations = Array.from(selectedFriends).map(friendId => ({
        event_id: eventId,
        sender_id: user.id,
        receiver_id: friendId,
        status: 'pending'
      }));
      
      const { error } = await supabase
        .from('event_invitations')
        .insert(invitations);
      
      if (error) throw error;
      
      toast({
        title: "Invitations sent! 🎉",
        description: `Invited ${selectedFriends.size} friend${selectedFriends.size > 1 ? 's' : ''} to ${eventTitle}`,
      });
      
      setSelectedFriends(new Set());
      setOpen(false);
    } catch (error: any) {
      console.error('Error sending invitations:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitations",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" size="lg">
          <UserPlus className="w-4 h-4" />
          Invite Friends
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Friends to Event</DialogTitle>
          <DialogDescription>
            Select friends to invite to {eventTitle}
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading friends...</p>
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No friends available to invite. Either you have no friends yet or all your friends have already been invited.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-smooth"
                    onClick={() => toggleFriend(friend.id)}
                  >
                    <Checkbox
                      checked={selectedFriends.has(friend.id)}
                      onCheckedChange={() => toggleFriend(friend.id)}
                    />
                    <Avatar>
                      <AvatarFallback>{friend.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-muted-foreground">{friend.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-muted-foreground">
                {selectedFriends.size} friend{selectedFriends.size !== 1 ? 's' : ''} selected
              </p>
              <Button
                onClick={handleSendInvitations}
                disabled={selectedFriends.size === 0 || sending}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? "Sending..." : "Send Invitations"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};