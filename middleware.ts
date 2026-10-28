import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // ผู้เยี่ยมชมทั่วไปไม่มีคุกกี้ล็อกอิน → ข้ามการเรียก Supabase เพื่อให้หน้าเปิดเร็ว
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!url || !key || !hasAuthCookie) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list: CookieToSet[]) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser(); // รีเฟรช session

  // บัญชีที่ยังใช้รหัสผ่านเริ่มต้น (วันเกิด) ต้องเปลี่ยนรหัสก่อนใช้งานส่วนอื่น (เฉพาะการเปิดหน้า GET)
  if (user && request.method === "GET") {
    const path = request.nextUrl.pathname;
    if (!path.startsWith("/account/password") && !path.startsWith("/login")) {
      const { data } = await supabase.from("profiles").select("must_change_password").eq("id", user.id).maybeSingle();
      if (data?.must_change_password) {
        const redirect = NextResponse.redirect(new URL("/account/password", request.url));
        response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
        return redirect;
      }
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
