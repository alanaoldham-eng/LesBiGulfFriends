import { createClient } from "@supabase/supabase-js";

type RssSyncBody = {
  title: string;
  slug: string;
  rssUrl: string;
  description?: string;
  websiteUrl?: string;
  artworkUrl?: string;
  editorialNote?: string;
  isFeatured?: boolean;
  featuredRank?: number | null;
};

function cleanText(value: string | null | undefined) {
  if (!value) return "";
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(block: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"));
  return cleanText(match?.[1] || "");
}

function getRawTag(block: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"));
  return cleanText(match?.[1] || "");
}

function getAttr(block: string, tag: string, attr: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`<${escaped}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, "i"));
  return cleanText(match?.[1] || "");
}

function slugify(value: string) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `item-${Date.now()}`;
}

async function requireReviewer(req: Request, supabase: any) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();

  if (!token) throw new Error("Missing auth token.");

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) throw new Error("Not authenticated.");

  const user = data.user;
  const email = String(user.email || "").toLowerCase();

  const [{ data: profile }, { data: adminRow }] = await Promise.all([
    supabase.from("profiles").select("id, is_moderator, is_banned, membership_status").eq("id", user.id).maybeSingle(),
    supabase.from("admin_users").select("user_id, role").eq("user_id", user.id).maybeSingle(),
  ]);

  const active =
    !!profile &&
    !profile.is_banned &&
    !["removed", "banned"].includes(String(profile.membership_status || "").toLowerCase());

  if (email !== "alanaoldham@gmail.com" && !adminRow && !(active && profile?.is_moderator)) {
    throw new Error("Only admin or moderators can curate content.");
  }

  return user;
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRole) {
      return Response.json({ ok: false, error: "Missing Supabase server env." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    await requireReviewer(req, supabase);

    const body = (await req.json()) as RssSyncBody;
    const slug = slugify(body.slug || body.title || "source");
    const rssUrl = String(body.rssUrl || "").trim();

    if (!rssUrl) {
      return Response.json({ ok: false, error: "RSS URL is required." }, { status: 400 });
    }

    const rssResponse = await fetch(rssUrl, {
      headers: {
        "User-Agent": "LesBiGulfFriends/1.0 RSS Sync",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      cache: "no-store",
    });

    if (!rssResponse.ok) {
      return Response.json({ ok: false, error: `RSS fetch failed: ${rssResponse.status}` }, { status: 400 });
    }

    const xml = await rssResponse.text();
    const channelBlock = xml.match(/<channel[^>]*>([\s\S]*?)<\/channel>/i)?.[1] || xml;
    const channelTitle = getTag(channelBlock, "title");
    const channelDescription = getRawTag(channelBlock, "description");
    const channelImage = getTag(getRawTag(channelBlock, "image"), "url") || getTag(channelBlock, "itunes:image") || getAttr(channelBlock, "itunes:image", "href");

    const sourcePayload = {
      slug,
      source_type: "podcast",
      title: body.title?.trim() || channelTitle || slug,
      description: body.description?.trim() || channelDescription || "",
      website_url: body.websiteUrl?.trim() || rssUrl,
      rss_url: rssUrl,
      external_links: { rss: rssUrl },
      artwork_url: body.artworkUrl?.trim() || channelImage || null,
      editorial_note: body.editorialNote?.trim() || body.description?.trim() || channelDescription || "",
      is_active: true,
      is_featured: body.isFeatured ?? true,
      featured_rank: Number.isFinite(Number(body.featuredRank)) ? Number(body.featuredRank) : null,
      updated_at: new Date().toISOString(),
    };

    const { data: source, error: sourceError } = await supabase
      .from("content_sources")
      .upsert(sourcePayload, { onConflict: "slug" })
      .select("*")
      .single();

    if (sourceError) {
      return Response.json({ ok: false, error: sourceError.message }, { status: 400 });
    }

    const itemBlocks = Array.from(xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)).map((m) => m[1]);
    const rows = itemBlocks.slice(0, 50).map((item, index) => {
      const title = getTag(item, "title") || `Episode ${index + 1}`;
      const link = getTag(item, "link");
      const guid = getTag(item, "guid") || link || `${slug}-${index}-${title}`;
      const description = getRawTag(item, "description") || getRawTag(item, "itunes:summary");
      const pubDate = getTag(item, "pubDate");
      const publishedAt = pubDate && !Number.isNaN(Date.parse(pubDate)) ? new Date(pubDate).toISOString() : null;
      const audioUrl = getAttr(item, "enclosure", "url") || getTag(item, "media:content") || null;
      const imageUrl = getAttr(item, "itunes:image", "href") || source.artwork_url || null;
      const durationText = getTag(item, "itunes:duration") || null;

      return {
        source_id: source.id,
        guid,
        slug: slugify(`${title}-${index}`),
        title,
        description,
        editorial_summary: "",
        author_name: getTag(item, "itunes:author") || null,
        published_at: publishedAt,
        item_url: link || null,
        audio_url: audioUrl,
        image_url: imageUrl,
        duration_text: durationText,
        raw_data: { rss_guid: guid, rss_url: rssUrl },
        is_published: true,
        is_hidden: false,
        updated_at: new Date().toISOString(),
      };
    });

    if (rows.length) {
      const { error: itemError } = await supabase
        .from("content_items")
        .upsert(rows, { onConflict: "source_id,guid" });

      if (itemError) {
        return Response.json({ ok: false, error: itemError.message }, { status: 400 });
      }
    }

    return Response.json({
      ok: true,
      source,
      syncedCount: rows.length,
    });
  } catch (error: any) {
    return Response.json({ ok: false, error: error?.message || "Unknown error" }, { status: 500 });
  }
}
