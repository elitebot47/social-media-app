import { auth } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userid } = await req.json();
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      {
        message: "Unauthorised request!",
      },
      { status: 401 }
    );
  }
  try {
    const UserPosts = await prisma.post.findMany({
      where: {
        authorId: Number(userid),
      },
      select: {
        images: true,
      },
    });

    const publicIdArray = UserPosts.flatMap((post) =>
      post.images?.map((image?) => image.publicId)
    );

    if (publicIdArray.length > 0) {
      await Promise.all(
        publicIdArray.map((id) =>
          cloudinary.uploader.destroy(id, {
            invalidate: true,
          })
        )
      );
    }

    await prisma.user.delete({
      where: {
        id: Number(userid),
      },
    });
    return NextResponse.json({ message: "Succesfully deleted" });
  } catch (error) {
    return NextResponse.json(
      { message: "Error while deleting user:  " + error },
      { status: 409 }
    );
  }
}
