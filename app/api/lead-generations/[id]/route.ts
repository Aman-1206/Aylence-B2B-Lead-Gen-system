import { NextResponse } from "next/server";
import { deleteLeadGeneration } from "@/lib/leadGenerations";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = await deleteLeadGeneration(id);

    if (!deleted) {
      return NextResponse.json({ error: "Lead generation not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to delete lead generation.",
      },
      { status: 400 },
    );
  }
}
