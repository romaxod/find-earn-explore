import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const FriendRequestNotifications = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      // Set up realtime subscription for new friend requests
      const channel = supabase
        .channel('friend-requests-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'friend_requests',
            filter: `receiver_id=eq.${user.id}`
          },
          () => {
            fetchRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await fetchRequests();
    }
  };

  const fetchRequests = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender:sender_id(id, name, email)
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "Friend request accepted! 🎉",
      });
      
      await fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "Request declined",
      });
      
      await fetchRequests();
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {requests.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {requests.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Friend Requests</h3>
          
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No pending requests
            </p>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {request.sender.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {request.sender.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {request.sender.email}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={() => handleAccept(request.id)}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleDecline(request.id)}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};