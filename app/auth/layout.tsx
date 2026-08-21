import { PublicRoute } from "@/guards/public-route";

type AuthLayoutProps = {
  children: React.ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <PublicRoute>
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <main className="flex-1">{children}</main>
      </div>
    </PublicRoute>
  );
};

export default AuthLayout;
