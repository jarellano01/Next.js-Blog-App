import React from "react";
import { createClient } from "./client";
import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import { Session } from "@supabase/supabase-js";

export async function downloadImage(
  bucketName: string,
  objectName: string,
) {
  const supabase = createClient();
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(objectName);

    console.log(data)
  if (data.publicUrl) {
    return data.publicUrl;
  }

  return null;
}

export const useUppy = (id: string) => {
  const supabase = createClient();
  const [session, setSession] = React.useState<Session | null>(null);
  // Check authentitication and bookmark states
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [session?.user.id, supabase.auth]);
  const token = session?.access_token;
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
  const supabaseUploadURL = `https://${projectId}.supabase.co/storage/v1/upload/resumable`;

  var uppy = new Uppy({
    id,
    autoProceed: false,
    debug: true,
    allowMultipleUploadBatches: true,
    restrictions: {
      maxFileSize: 6000000,
      maxNumberOfFiles: 1,
    },
  }).use(Tus, {
    endpoint: supabaseUploadURL,
    headers: {
      authorization: `Bearer ${token}`,
    },
    chunkSize: 6 * 1024 * 1024,
    allowedMetaFields: [
      "bucketName",
      "objectName",
      "contentType",
      "cacheControl",
    ],
  });
  return uppy;

}
