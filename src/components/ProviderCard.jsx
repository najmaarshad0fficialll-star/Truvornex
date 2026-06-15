import { Link } from 'react-router-dom';
import { MapPin, CheckCircle, Star, Clock } from 'lucide-react';

export default function ProviderCard({ provider, distance }) {
    return (
        <Link
            to={`/providers/${provider.id}`}
            className="group card-premium block overflow-hidden"
        >
            <div className="h-40 bg-zinc-100 overflow-hidden relative">
                {provider.cover_image ? (
                    <img src={provider.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                        <span className="text-5xl font-black text-zinc-300 font-inter select-none">
                            {provider.business_name?.[0]?.toUpperCase()}
                        </span>
                    </div>
                )}
                {provider.verified && (
                    <div className="absolute top-3 right-3 glass rounded-full p-1.5 shadow-float">
                        <CheckCircle className="h-3.5 w-3.5 text-zinc-700" />
                    </div>
                )}
                {distance != null && distance < 9999 && (
                    <div className="absolute top-3 left-3 glass rounded-full px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-float">
                        {distance.toFixed(1)} km
                    </div>
                )}
            </div>
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-inter font-bold text-sm leading-tight text-zinc-900 group-hover:text-black transition-colors">
                        {provider.business_name}
                    </h3>
                </div>
                <div className="flex items-center gap-3 mb-2.5">
                    {provider.rating > 0 ? (
                        <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-zinc-800 text-zinc-800" />
                            <span className="text-xs font-semibold text-zinc-800">{provider.rating?.toFixed(1)}</span>
                            <span className="text-xs text-zinc-400">({provider.review_count})</span>
                        </div>
                    ) : (
                        <span className="text-xs text-zinc-400">No reviews yet</span>
                    )}
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock className="h-3 w-3" />
                        <span>Quick response</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{provider.city || provider.address}</span>
                </div>
            </div>
        </Link>
    );
}