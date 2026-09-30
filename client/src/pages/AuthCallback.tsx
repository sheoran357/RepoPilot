import { useEffect } from "react";

const AuthCallback = () => {
    useEffect(() => {
        const params = new URLSearchParams(
            window.location.search
        );

        const token = params.get("token");

        if (token) {
            localStorage.setItem(
                "token",
                token
            );

            window.location.href =
                "/dashboard";
        }
    }, []);

    return (
        <div>
            <h2>Signing you in...</h2>
        </div>
    );
};

export default AuthCallback;