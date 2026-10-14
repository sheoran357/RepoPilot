import { useEffect, useState } from "react";

const AuthCallback = () => {
    const [error, setError] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(
            window.location.search
        );

        const token = params.get("token");

        if (token) {
            localStorage.setItem("token", token);
            window.location.replace("/dashboard");
            return;
        }

        setError(
            "GitHub sign-in did not return an authentication token. Please return to the login page and try again."
        );
    }, []);

    return (
        <div>
            {error ? (
                <>
                    <h2>Sign-in failed</h2>
                    <p>{error}</p>
                    <a href="/">Back to login</a>
                </>
            ) : (
                <h2>Signing you in...</h2>
            )}
        </div>
    );
};

export default AuthCallback;
