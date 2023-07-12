'use client'

import RegistrationForm from '../page.tsx';
import { useSearchParams } from 'next/navigation'

export default function NameProfile( { params: { name }} ) {

    return (
        <RegistrationForm nameToOpen = {name[0]} />
    );
}