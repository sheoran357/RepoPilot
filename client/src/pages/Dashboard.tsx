import { useEffect, useState } from "react";
import api from "../services/api.js";

interface User {
    username: string;
    avatarUrl?: string;
}

const Dashboard = () => {
    const [user, setUser] =
        useState<User | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const response =
                    await api.get("/auth/me");

                setUser(response.data.user);
            } catch (error) {
                console.error(
                    "Failed to load user:",
                    error
                );
            }
        };

        loadUser();
    }, []);

    return (
        <div>
            <h1>RepoPilot Dashboard</h1>

            {user && (
                <div>
                    <h2>
                        Welcome, {user.username}
                    </h2>

                    {user.avatarUrl && (
                        <img
                            src={user.avatarUrl}
                            alt="GitHub avatar"
                            width="80"
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;