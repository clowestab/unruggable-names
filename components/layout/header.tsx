import React from 'react'

import classNames from 'clsx'
import Image from 'next/image'

import { siteConfig } from '@/config/site'
import BranchButtonLoginOrAccount from '@/integrations/siwe/components/branch-button-login-or-account'
import useScroll from '@/lib/hooks/use-scroll'

import { NavigationMenuGeneral } from './navigation-menu-general'
import { UserDropdown } from './user-dropdown'
import { BranchColorMode } from '../shared/branch-color-mode'
import { LinkComponent } from '../shared/link-component'
import { ResponsiveMobileAndDesktop } from '../shared/responsive-mobile-and-desktop'
import { ThemeToggle } from '../shared/theme-toggle'

import { useAccount, useEnsAvatar } from 'wagmi'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


interface Props {
  className?: string
}

export function Header(props: Props) {

  const { address }      = useAccount()

  const { data: avatar, isError, isLoading } = useEnsAvatar({
    address: address,
  })

  console.log("avatar", avatar);

  const scrolled = useScroll(50)
  const classes = classNames(
    props.className,
    'Header',
    'fixed top-0 w-full',
    'px-6 lg:px-10 py-3 mb-8 flex items-center',
    {
      'border-b border-gray-200 bg-white/50 backdrop-blur-xl dark:bg-black/50 dark:border-gray-800': scrolled,
    },
    'z-30 transition-all'
  )
  return (
    <header className={classes}>
      <ResponsiveMobileAndDesktop>
        <>
          <div className="flex w-full justify-between p-4">
            <LinkComponent href="/" className="flex flex-1 items-center ">
              <BranchColorMode>
                <Image alt="Logo" src="/logo-dark.png" width={32} height={32} />
                <Image alt="Logo" src="/logo-white.png" width={32} height={32} />
              </BranchColorMode>
            </LinkComponent>
            {/*<div className="">
              <UserDropdown />
            </div>*/}
          </div>
        </>
        <>
          <LinkComponent className="flex items-center" href="/">
            <BranchColorMode>
              <Image alt="Logo" src="/logo-dark.png" width={32} height={32} />
              <Image alt="Logo" src="/logo-white.png" width={32} height={32} />
            </BranchColorMode>
            <h1 className="text-gradient-sand ml-2 text-2xl font-bold">{siteConfig.name}</h1>
          </LinkComponent>
          {/*<div className="flex flex-1 justify-center lg:px-10">
            <NavigationMenuGeneral />
          </div>*/}

          <div className = "flex-grow"></div>
          
          {<div className="flex items-center gap-4">
            {/*<BranchButtonLoginOrAccount classNameButtonLogout="menu-item" classNameButtonLogin="menu-item colormode" />
            <LinkComponent className="flex items-center" href="/dashboard">
              <button className="btn btn-pill bg-gradient-button hover:scale-105 hover:shadow-lg">
                <span className="px-2">Dashboard</span>
              </button>
            </LinkComponent>*/}

            <ThemeToggle />

            {avatar && (
              <Avatar>
                <AvatarImage src={avatar} />
                <AvatarFallback>YOU</AvatarFallback>
              </Avatar>
            )}
          </div>}
        </>
      </ResponsiveMobileAndDesktop>
    </header>
  )
}
