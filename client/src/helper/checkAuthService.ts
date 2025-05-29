import axios from "axios";
import Cookies from "js-cookie";

interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    name: string;
  };
}

export const checkAuthService = async (): Promise<AuthResponse> => {
  try {
    const accessToken = Cookies?.get("accessToken");

    if (!accessToken) {
      return { success: false };
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/user/check-auth`,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return { success: false };
  }
};
