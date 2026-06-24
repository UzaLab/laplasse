import { cn } from '@/lib/utils'
import { HOME_MOBILE_TRACK } from './homeMobileLayout'

interface HomeMobileV2CarouselTrackProps {
  children: React.ReactNode
  className?: string
}

/** Piste de carrousel alignée à gauche sur le gutter mobile (24px). */
export function HomeMobileV2CarouselTrack({ children, className }: HomeMobileV2CarouselTrackProps) {
  return (
    <div
      className={cn(
        'flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory scroll-smooth justify-start items-stretch',
        HOME_MOBILE_TRACK,
        className,
      )}
    >
      {children}
    </div>
  )
}
