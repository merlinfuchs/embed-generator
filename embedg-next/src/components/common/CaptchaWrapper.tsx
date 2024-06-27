import dynamic from "next/dynamic";

export default dynamic(() => import("./Captcha"), { ssr: false });
