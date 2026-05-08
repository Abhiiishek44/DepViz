import { FileNode, FolderNode } from "../types/graphTypes";

const getPathSegments = (path: string) => path.split("/").filter(Boolean);

const getCommonRootSegments = (paths: string[]) => {
  if (paths.length === 0) return [] as string[];

  const segments = paths.map(getPathSegments);
  const minLength = Math.min(...segments.map((segment) => segment.length));
  const root: string[] = [];

  for (let index = 0; index < minLength; index += 1) {
    const segment = segments[0][index];
    if (segments.every((current) => current[index] === segment)) {
      root.push(segment);
    } else {
      break;
    }
  }

  return root;
};

const getRelativeSegments = (path: string, rootSegments: string[]) => {
  const segments = getPathSegments(path);
  return segments.slice(rootSegments.length);
};

export const buildFolderMap = (files: FileNode[]) => {
  const filePaths = files.map((file) => file.path.replace(/\\/g, "/"));
  const rootSegments = getCommonRootSegments(filePaths);
  const folders = new Map<string, FolderNode>();

  files.forEach((file) => {
    const relativeSegments = getRelativeSegments(file.path.replace(/\\/g, "/"), rootSegments);
    const folderSegments = relativeSegments.slice(0, -1);

    if (folderSegments.length === 0) {
      folderSegments.push("(root)");
    }

    let currentPath = "";
    let previousFolderId: string | undefined = undefined;

    folderSegments.forEach((segment, index) => {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const folderId = `folder:${currentPath}`;

      if (!folders.has(folderId)) {
        folders.set(folderId, {
          id: folderId,
          name: segment,
          fullPath: currentPath,
          parentFolderId: previousFolderId,
          childFolders: [],
          files: []
        });
      }

      const folder = folders.get(folderId)!;

      if (previousFolderId) {
        const parent = folders.get(previousFolderId)!;
        if (!parent.childFolders.includes(folderId)) {
          parent.childFolders.push(folderId);
        }
      }

      if (index === folderSegments.length - 1) {
        folder.files.push(file.id);
      }

      previousFolderId = folderId;
    });
  });

  return Array.from(folders.values());
};
