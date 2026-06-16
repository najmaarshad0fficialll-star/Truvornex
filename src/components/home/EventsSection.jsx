import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, ArrowRight, Users, Plus, Music2, Wrench, Handshake, Trophy, Sparkles, ImageIcon, UtensilsCrossed, Building2, TreePine, Sun, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CATEGORY_ICONS = {
    concert:    Music2,
    workshop:   Wrench,
    meetup:     Handshake,
    sports:     Trophy,
    festival:   Sparkles,
    exhibition: ImageIcon,
    food:       UtensilsCrossed,
    other:      Calendar,
};

const VENUE_SPOTS = [
    { icon: Building2, name: 'Grand Hall'   },
    { icon: Layers,    name: 'Rooftop'      },
    { icon: TreePine,  name: 'Open Ground'  },
    { icon: Building2, name: 'The Loft'     },
    { icon: Sun,       name: 'Terrace'      },
    { icon: Sparkles,  name: 'Ballroom'     },
];

const VENUE_TYPES = { hall: 'Community Hall', rooftop: 'Rooftop', open_ground: 'Open Ground', indoor: 'Indoor', online: 'Online', other: 'Other' };

export default function EventsSection({ user }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ticketDialog, setTicketDialog] = useState(null);
    const [buying, setBuying] = useState(false);
    const [quickCreate, setQuickCreate] = useState(false);
    const [form, setForm] = useState({ title: '', category: 'meetup', venue_name: '', date: '', ticket_price: 0, is_free: true, total_tickets: 100 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/events');
                const { data } = await res.json();
                if (data) setEvents(data.filter(e => !e.date || new Date(e.date) >= new Date(new Date().setHours(0,0,0,0))).slice(0, 6));
            } catch (e) {
                console.error('Failed to load events', e);
            }
            setLoading(false);
        })();
    }, []);

    const buyTicket = async (event) => {
        if (!user) { toast.error('Please log in to buy tickets'); return; }
        setBuying(true);
        try {
            const code = `TRV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const res = await fetch('/api/event-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    event_id: event.id, event_title: event.title,
                    quantity: 1, unit_price: event.ticket_price || 0
                })
            });
            const { error } = await res.json();
            if (error) throw new Error(error);
            setEvents(prev => prev.map(e => e.id === event.id ? { ...e, tickets_sold: (e.tickets_sold || 0) + 1 } : e));
            toast.success(`Ticket booked! Code: ${code}`);
            setTicketDialog(null);
        } catch (e) {
            toast.error(e.message || 'Failed to book ticket');
        }
        setBuying(false);
    };

    const createEvent = async () => {
        if (!form.title || !form.date || !form.venue_name) { toast.error('Title, date and venue required'); return; }
        if (!user) { toast.error('Please log in to create events'); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form)
            });
            const { error } = await res.json();
            if (error) throw new Error(error);
            toast.success('Event published!');
            setQuickCreate(false);
            setForm({ title: '', category: 'meetup', venue_name: '', date: '', ticket_price: 0, is_free: true, total_tickets: 100 });
            // Reload events
            const res2 = await fetch('/api/events');
            const { data } = await res2.json();
            if (data) setEvents(data.filter(e => !e.date || new Date(e.date) >= new Date(new Date().setHours(0,0,0,0))).slice(0, 6));
        } catch (e) {
            toast.error(e.message || 'Failed to create event');
        }
        setSaving(false);
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="font-display font-bold text-xl tracking-tight">Local Events</h2>
                    <p className="text-zinc-500 text-sm mt-0.5 font-inter">Concerts, workshops, meetups & ticketed experiences</p>
                </div>
                <div className="flex items-center gap-2">
                    {user && (
                        <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-xs" onClick={() => setQuickCreate(true)}>
                            <Plus className="h-3.5 w-3.5" /> Create Event
                        </Button>
                    )}
                    <Link to="/events" className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                        All events <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>

            {/* Category quick-filters */}
            <div className="flex gap-2 flex-wrap mb-4">
                {[
                    [Music2,      'Concerts',  '/events?cat=concert'  ],
                    [Wrench,      'Workshops', '/events?cat=workshop' ],
                    [Handshake,   'Meetups',   '/events?cat=meetup'   ],
                    [Sparkles,    'Festivals', '/events?cat=festival' ],
                    [UtensilsCrossed, 'Food',  '/events?cat=food'     ],
                ].map(([Icon, label, to]) => (
                    <Link key={to} to={to} className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900 transition-all">
                        <Icon className="h-3.5 w-3.5" /> {label}
                    </Link>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton-wave h-52 rounded-2xl" />)}
                </div>
            ) : events.length === 0 ? (
                <div className="card-premium p-10 text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-3 text-zinc-200" />
                    <p className="text-zinc-400 text-sm">No upcoming events yet</p>
                    {user && <Button size="sm" variant="outline" className="rounded-xl mt-3" onClick={() => setQuickCreate(true)}>Create the first event</Button>}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map(event => {
                        const soldOut = (event.tickets_sold || 0) >= (event.total_tickets || 1);
                        const pct = Math.min(100, Math.round((event.tickets_sold || 0) / (event.total_tickets || 1) * 100));
                        const CatIcon = CATEGORY_ICONS[event.category] || Calendar;
                        return (
                            <div key={event.id} className="card-premium overflow-hidden group hover:-translate-y-0.5 transition-transform">
                                <div className="h-32 bg-gradient-to-br from-zinc-800 to-zinc-600 flex items-center justify-center relative">
                                    {event.image_url
                                        ? <img src={event.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                        : <CatIcon className="h-10 w-10 text-zinc-400" />
                                    }
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <span className="absolute top-2.5 left-2.5 bg-white/90 dark:bg-zinc-900/90 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">{event.category}</span>
                                    {soldOut && <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SOLD OUT</span>}
                                    <p className="absolute bottom-2.5 left-3 text-white font-bold text-sm line-clamp-1 drop-shadow">{event.title}</p>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-1 text-xs text-zinc-500 mb-3">
                                        <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 shrink-0" />{event.date}{event.start_time && ` · ${event.start_time}`}</div>
                                        <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" />{event.venue_name} · {VENUE_TYPES[event.venue_type] || event.venue_type}</div>
                                        <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 shrink-0" />{event.tickets_sold || 0}/{event.total_tickets} going</div>
                                    </div>
                                    <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3 overflow-hidden">
                                        <div className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                    {event.bundle_services?.length > 0 && (
                                        <div className="flex gap-1 flex-wrap mb-2">
                                            {event.bundle_services.slice(0, 3).map(s => <span key={s} className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">{s}</span>)}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="font-bold text-sm">{event.is_free || !event.ticket_price ? 'Free' : `$${event.ticket_price}`}</span>
                                        <Button size="sm" className="rounded-xl h-7 text-xs gap-1" disabled={soldOut} onClick={() => setTicketDialog(event)}>
                                            <Ticket className="h-3 w-3" /> {soldOut ? 'Full' : 'Get Ticket'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Venue spotlight strip */}
            <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
                {VENUE_SPOTS.map(({ icon: VIcon, name }) => (
                    <Link key={name} to="/events?tab=venues"
                        className="glass rounded-xl p-2.5 text-center hover:shadow-premium transition-all group">
                        <div className="flex justify-center mb-1">
                            <VIcon className="h-5 w-5 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                        </div>
                        <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">{name}</p>
                    </Link>
                ))}
            </div>

            {/* Ticket Dialog */}
            <Dialog open={!!ticketDialog} onOpenChange={() => setTicketDialog(null)}>
                {ticketDialog && (
                    <DialogContent className="max-w-sm">
                        <DialogHeader><DialogTitle>Get Ticket</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-1">
                            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
                                <p className="font-bold">{ticketDialog.title}</p>
                                <p className="text-xs text-zinc-400 mt-1">{ticketDialog.date} · {ticketDialog.venue_name}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold">Price</p>
                                <p className="font-bold text-xl">{ticketDialog.is_free || !ticketDialog.ticket_price ? 'Free' : `$${ticketDialog.ticket_price}`}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                <span>Remaining</span>
                                <span className="font-semibold">{(ticketDialog.total_tickets || 0) - (ticketDialog.tickets_sold || 0)} tickets</span>
                            </div>
                            {ticketDialog.bundle_services?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Included Services</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {ticketDialog.bundle_services.map(s => <span key={s} className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 px-2 py-0.5 rounded-full">{s}</span>)}
                                    </div>
                                </div>
                            )}
                            <Button className="w-full h-11 rounded-xl gap-2" onClick={() => buyTicket(ticketDialog)} disabled={buying}>
                                <Ticket className="h-4 w-4" /> {buying ? 'Booking…' : ticketDialog.is_free || !ticketDialog.ticket_price ? 'Reserve Free Ticket' : `Pay $${ticketDialog.ticket_price}`}
                            </Button>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            {/* Quick Create Dialog */}
            <Dialog open={quickCreate} onOpenChange={setQuickCreate}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-1">
                        <Input placeholder="Event title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl" />
                        <div className="grid grid-cols-2 gap-3">
                            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>{Object.keys(CATEGORY_ICONS).map(k => <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>)}</SelectContent>
                            </Select>
                            <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="rounded-xl" />
                        </div>
                        <Input placeholder="Venue name *" value={form.venue_name} onChange={e => setForm(p => ({ ...p, venue_name: e.target.value }))} className="rounded-xl" />
                        <div className="grid grid-cols-2 gap-3">
                            <Input type="number" placeholder="Total tickets" value={form.total_tickets} onChange={e => setForm(p => ({ ...p, total_tickets: Number(e.target.value) }))} className="rounded-xl" />
                            <Input type="number" placeholder="Price (0 = free)" value={form.ticket_price} onChange={e => setForm(p => ({ ...p, ticket_price: Number(e.target.value), is_free: Number(e.target.value) === 0 }))} className="rounded-xl" />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button className="flex-1 h-10 rounded-xl" onClick={createEvent} disabled={saving}>{saving ? 'Publishing…' : 'Publish Event'}</Button>
                            <Link to="/events" className="flex-1">
                                <Button variant="outline" className="w-full h-10 rounded-xl">Full Editor</Button>
                            </Link>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
}
