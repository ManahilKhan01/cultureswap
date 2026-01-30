import { supabase } from './supabase';

type PresenceState = {
    [key: string]: any[];
};

type OnlineStatusCallback = (onlineUserIds: Set<string>) => void;

class PresenceService {
    private channel: any = null;
    private onlineUsers: Set<string> = new Set();
    private listeners: Set<OnlineStatusCallback> = new Set();
    private userId: string | null = null;

    constructor() {
        this.init();
    }

    private init() {
        // Listen for auth changes to connect/disconnect
        supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user?.id) {
                if (this.userId !== session.user.id) {
                    this.userId = session.user.id;
                    this.connect(session.user.id);
                }
            } else {
                this.userId = null;
                this.disconnect();
            }
        });
    }

    private async connect(userId: string) {
        if (this.channel) return;

        console.log('Initializing presence for user:', userId);

        this.channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        this.channel
            .on('presence', { event: 'sync' }, () => {
                const newState = this.channel.presenceState() as PresenceState;
                this.updateOnlineUsers(newState);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
                // optimistically add
                this.onlineUsers.add(key);
                this.notifyListeners();
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
                // optimistically remove
                this.onlineUsers.delete(key);
                this.notifyListeners();
            })
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    await this.channel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });
    }

    private updateOnlineUsers(state: PresenceState) {
        this.onlineUsers.clear();
        Object.keys(state).forEach((key) => {
            this.onlineUsers.add(key);
        });
        this.notifyListeners();
    }

    private notifyListeners() {
        this.listeners.forEach((callback) => callback(new Set(this.onlineUsers)));
    }

    public disconnect() {
        if (this.channel) {
            supabase.removeChannel(this.channel);
            this.channel = null;
        }
        this.onlineUsers.clear();
        this.notifyListeners();
    }

    public subscribe(callback: OnlineStatusCallback) {
        this.listeners.add(callback);
        // Send immediate state
        callback(new Set(this.onlineUsers));
        return () => {
            this.listeners.delete(callback);
        };
    }

    public isUserOnline(userId: string): boolean {
        return this.onlineUsers.has(userId);
    }
}

export const presenceService = new PresenceService();
