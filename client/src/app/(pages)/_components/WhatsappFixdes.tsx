import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export default function WhatsappFixdes() {
  return (
    // <div>
        <Link href="https://api.whatsapp.com/send/?phone=%2B919971145671&text&type=phone_number&app_absent=0" target='_blank' className="fixed bottom-5 right-5 bg-green-500 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-300 z-50">
            <Image src="/whatsapp.webp" alt="Whatsapp Fixdes" width={20} height={20} className="w-10 h-10" />
        </Link>
    // </div>
  )
}
