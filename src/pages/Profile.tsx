import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User, Users, MessageCircle, Coins, Mail, Check, X, Send, Calendar } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [newHobby, setNewHobby] = useState("");
  
  // Social features states
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [eventInvitations, setEventInvitations] = useState<any[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }
    
    setUser(session.user);
    await fetchProfile(session.user.id);
    await fetchFriends(session.user.id);
    await fetchFriendRequests(session.user.id);
    await fetchEventInvitations(session.user.id);
    await fetchConversations(session.user.id);
  };

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      setName(data.name || "");
      setAge(data.age?.toString() || "");
      setGender(data.gender || "");
      setHobbies(data.hobbies || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async (userId: string) => {
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
      
      // Map to get the friend's profile (not the current user)
      const friendsList = friendData?.map((req: any) => {
        return req.sender_id === userId ? req.receiver : req.sender;
      }) || [];
      
      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchFriendRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender:sender_id(id, name, email)
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending');
      
      if (error) throw error;
      setFriendRequests(data || []);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const fetchEventInvitations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_invitations')
        .select(`
          *,
          sender:sender_id(id, name, email),
          event:event_id(id, title, image_url, time, location_name)
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEventInvitations(data || []);
    } catch (error) {
      console.error('Error fetching event invitations:', error);
    }
  };

  const fetchConversations = async (userId: string) => {
    try {
      const { data: participantData, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const conversationIds = participantData?.map(p => p.conversation_id) || [];
      
      if (conversationIds.length > 0) {
        const { data: convData, error: convError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            user:user_id(id, name, email)
          `)
          .in('conversation_id', conversationIds)
          .neq('user_id', userId);
        
        if (convError) throw convError;
        
        // Group by user (not by conversation) - same logic as Conversations page
        const usersMap = new Map();
        
        convData?.forEach((cp: any) => {
          const userIdKey = cp.user.id;
          if (!usersMap.has(userIdKey)) {
            usersMap.set(userIdKey, {
              id: cp.conversation_id,
              participants: [cp.user]
            });
          }
        });
        
        setConversations(Array.from(usersMap.values()));
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          age: age ? parseInt(age) : null,
          gender,
          hobbies
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      setEditing(false);
      await fetchProfile(user.id);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user || !searchUsername) return;
    
    try {
      // Find user by username
      const { data: targetProfile, error: searchError } = await supabase
        .from('profiles')
        .select('id, name')
        .ilike('name', searchUsername)
        .single();
      
      if (searchError) throw new Error("User not found");
      
      if (targetProfile.id === user.id) {
        toast({
          title: "Error",
          description: "You can't send a friend request to yourself",
          variant: "destructive",
        });
        return;
      }
      
      // Send friend request
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: targetProfile.id,
          status: 'pending'
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Friend request sent to ${targetProfile.name}`,
      });
      
      setSearchUsername("");
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Friend request accepted",
      });
      
      await fetchFriends(user.id);
      await fetchFriendRequests(user.id);
      await fetchEventInvitations(user.id);
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Friend request declined",
      });
      
      await fetchFriendRequests(user.id);
      await fetchEventInvitations(user.id);
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const handleAcceptEventInvitation = async (invitationId: string, eventId: string) => {
    try {
      const { error } = await supabase
        .from('event_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);
      
      if (error) throw error;
      
      // Optionally auto-RSVP to the event
      await supabase
        .from('event_rsvps')
        .insert({
          event_id: eventId,
          user_id: user.id,
        });
      
      toast({
        title: "Invitation accepted! 🎉",
        description: "You're now going to this event",
      });
      
      await fetchEventInvitations(user.id);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive",
      });
    }
  };

  const handleDeclineEventInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('event_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);
      
      if (error) throw error;
      
      toast({
        title: "Invitation declined",
      });
      
      await fetchEventInvitations(user.id);
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  const handleStartConversation = async (friendId: string) => {
    if (!user) return;
    
    try {
      // Check if conversation already exists
      const existingConv = conversations.find(conv => 
        conv.participants.some((p: any) => p.id === friendId)
      );
      
      if (existingConv) {
        navigate(`/messages/${existingConv.id}`);
        return;
      }
      
      // Create new conversation
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();
      
      if (convError) throw convError;
      
      // Add participants
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: convData.id, user_id: user.id },
          { conversation_id: convData.id, user_id: friendId }
        ]);
      
      if (partError) throw partError;
      
      navigate(`/messages/${convData.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const addHobby = () => {
    if (newHobby && !hobbies.includes(newHobby)) {
      setHobbies([...hobbies, newHobby]);
      setNewHobby("");
    }
  };

  const removeHobby = (hobby: string) => {
    setHobbies(hobbies.filter(h => h !== hobby));
  };

  const handleConversationsTabClick = async () => {
    if (!user) return;
    
    // Immediately clear the notification badge
    window.dispatchEvent(new CustomEvent('conversationsClicked'));
    
    // Mark all conversations as read
    try {
      const { data: userConvData } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);
      
      if (userConvData && userConvData.length > 0) {
        for (const conv of userConvData) {
          await supabase.rpc('update_conversation_read_status', {
            conv_id: conv.conversation_id,
            user_id: user.id
          });
        }
        
        // Notify navbar to refresh after marking as read
        window.dispatchEvent(new CustomEvent('conversationsViewed'));
      }
    } catch (error) {
      console.error('Error marking conversations as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="container max-w-7xl mx-auto">
            <p className="text-xl text-muted-foreground text-center">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-7xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold">
              My <span className="gradient-hero-text">Profile</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Manage your profile and connect with friends
            </p>
          </div>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="friends" className="gap-2">
                <Users className="w-4 h-4" />
                Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger 
                value="conversations" 
                className="gap-2"
                onClick={handleConversationsTabClick}
              >
                <MessageCircle className="w-4 h-4" />
                Conversations ({conversations.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Personal Information</CardTitle>
                  <Button 
                    variant={editing ? "outline" : "default"}
                    onClick={() => editing ? handleUpdateProfile() : setEditing(true)}
                  >
                    {editing ? "Save Changes" : "Edit Profile"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Input
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={profile?.email || ""} disabled />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      Credits Balance
                    </Label>
                    <div className="text-3xl font-bold gradient-hero-text">
                      {profile?.credits || 0}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Hobbies</Label>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {hobbies.map((hobby) => (
                        <Badge key={hobby} variant="secondary" className="gap-2">
                          {hobby}
                          {editing && (
                            <X 
                              className="w-3 h-3 cursor-pointer hover:text-destructive" 
                              onClick={() => removeHobby(hobby)}
                            />
                          )}
                        </Badge>
                      ))}
                    </div>
                    
                    {editing && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a hobby"
                          value={newHobby}
                          onChange={(e) => setNewHobby(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addHobby()}
                        />
                        <Button onClick={addHobby}>Add</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="friends" className="space-y-6 mt-6">
              {eventInvitations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Event Invitations ({eventInvitations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {eventInvitations.map((invitation: any) => (
                      <div key={invitation.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <img 
                          src={invitation.event.image_url} 
                          alt={invitation.event.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{invitation.event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Invited by {invitation.sender.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(invitation.event.time).toLocaleDateString()} at {invitation.event.location_name}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptEventInvitation(invitation.id, invitation.event_id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeclineEventInvitation(invitation.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => navigate(`/event/${invitation.event_id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              
              {friendRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Friend Requests ({friendRequests.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {friendRequests.map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{request.sender.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.sender.name}</p>
                            <p className="text-sm text-muted-foreground">{request.sender.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptRequest(request.id, request.sender_id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeclineRequest(request.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle>Add Friends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter friend's username"
                      value={searchUsername}
                      onChange={(e) => setSearchUsername(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendFriendRequest()}
                    />
                    <Button onClick={handleSendFriendRequest}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>My Friends ({friends.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {friends.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No friends yet. Start adding friends to connect!
                        </p>
                      ) : (
                        friends.map((friend: any) => (
                          <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{friend.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{friend.name}</p>
                                <p className="text-sm text-muted-foreground">{friend.email}</p>
                              </div>
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => handleStartConversation(friend.id)}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="conversations" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Conversations ({conversations.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageCircle className="w-8 h-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium mb-1">No conversations yet</p>
                        <p className="text-sm text-muted-foreground">
                          Message a friend from the Friends tab to start chatting!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {conversations.map((conversation: any) => (
                          <button 
                            key={conversation.id} 
                            className="w-full flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all text-left animate-fade-in"
                            onClick={() => navigate(`/messages/${conversation.id}`)}
                          >
                            <Avatar className="w-12 h-12 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                {conversation.participants[0]?.name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">
                                {conversation.participants.map((p: any) => p.name).join(", ")}
                              </p>
                              <p className="text-sm text-muted-foreground">Click to open chat</p>
                            </div>
                            <MessageCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;