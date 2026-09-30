import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/auth/callback"
                    element={<AuthCallback />}
                />

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />
            </Routes>
        </BrowserRouter>
    );
};

export default App;