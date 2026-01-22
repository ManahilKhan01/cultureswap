import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { supabase } from "@/lib/supabase";

const MainLayout = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setIsLoggedIn(!!session?.user);

                // Listen for auth changes
                const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                    setIsLoggedIn(!!session?.user);
                });

                return () => subscription.unsubscribe();
            } catch (error) {
                console.error('Error checking auth in layout:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Show a blank state or loader if still checking initial auth
    if (loading) return null;

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar isLoggedIn={isLoggedIn} />
            <main className="flex-grow">
                <Outlet context={{ isLoggedIn }} />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
