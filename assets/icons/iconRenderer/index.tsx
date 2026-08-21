// components/IconRenderer.tsx
'use client'

import dynamic from 'next/dynamic'
import React, { SVGProps } from 'react'
import { iconName } from './types'
import { cn } from '@/lib/utils'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: iconName
}

// Cache object for memoized icon components
const iconCache: Record<string, React.ComponentType<SVGProps<SVGSVGElement>>> = {}

/**
 * Warms `iconCache` for `name` with the real icon component (bypassing `next/dynamic`
 * entirely). `loadIcon` below always returns the raw cached component when present, skipping
 * the `dynamic(..., { ssr: false })` wrapper — so once this resolves, IconRenderer renders
 * the actual SVG synchronously instead of the empty loading placeholder.
 *
 * Needed for `renderToStaticMarkup` (lib/pdf/build-invoice-html.tsx): `next/dynamic`'s
 * SSR-during-render machinery only works inside Next's own page request lifecycle. Calling
 * renderToStaticMarkup directly, outside that lifecycle, means `ssr: false` always wins and
 * the icon never resolves — regardless of the flag's value. Pre-populating the cache is the
 * only way to get a real icon into a one-shot static render.
 */
export async function preloadIcon(name: iconName): Promise<void> {
  if (iconCache[name]) return
  const mod = await import(`../${name}.tsx`)
  iconCache[name] = (mod.default ?? mod[name]) as React.ComponentType<SVGProps<SVGSVGElement>>
}

const loadIcon = (name: iconName) => {
  // return memoized icon if already loaded
  if (iconCache[name]) return iconCache[name]

  const DynamicIcon = dynamic<SVGProps<SVGSVGElement>>(
    () =>
      import(`../${name}.tsx`).then(mod => {
        const component = (mod.default ?? mod[name]) as React.ComponentType<SVGProps<SVGSVGElement>>
        // store component in cache
        iconCache[name] = component
        return { default: component }
      }),
    {
      ssr: false,
      loading: () => <span className="block size-full shrink-0" aria-hidden />,
    }
  )

  return DynamicIcon
}

export const IconRenderer: React.FC<IconProps> = ({
  name,
  className,
  width,
  height,
  color,
  ...props
}) => {
  const DynamicIcon = loadIcon(name)
  const hasExplicitDimensions = width !== undefined || height !== undefined

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        !hasExplicitDimensions && 'size-5',
        className
      )}
      style={
        hasExplicitDimensions
          ? {
              width: width ?? 20,
              height: height ?? 20,
            }
          : undefined
      }
    >
      <DynamicIcon
        {...props}
        width="100%"
        height="100%"
        color={color ?? 'currentColor'}
        className={cn('block size-full text-text-primary', className)}
      />
    </span>
  )
}
