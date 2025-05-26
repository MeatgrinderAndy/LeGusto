'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useState } from 'react'
import { notFound, useRouter } from 'next/navigation'
import '@/components/Header.css'
import { useEffect } from 'react';

export default function AdminPanel(){
    const router = useRouter();
    useEffect(() => {
        const isAdmin = localStorage.getItem('is_admin');
        if (isAdmin !== 'true') {
          notFound(); // если не админ — редирект на главную
        }
      }, []);
    
    return (
        <div>
            <p>admin panel</p>
        </div>
    )
} 
