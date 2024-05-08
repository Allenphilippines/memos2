import { Dropdown, Menu, MenuButton, MenuItem, Tooltip } from "@mui/joy";
import toast from "react-hot-toast";
import useDebounce from "react-use/lib/useDebounce";
import { memoServiceClient } from "@/grpcweb";
import { useFilterStore } from "@/store/module";
import { useMemoList, useTagStore } from "@/store/v1";
import { useTranslate } from "@/utils/i18n";
import { showCommonDialog } from "../Dialog/CommonDialog";
import Icon from "../Icon";
import showRenameTagDialog from "../RenameTagDialog";

const TagsSection = () => {
  const t = useTranslate();
  const filterStore = useFilterStore();
  const tagStore = useTagStore();
  const memoList = useMemoList();
  const filter = filterStore.state;
  const tagAmounts = Object.entries(tagStore.getState().tagAmounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .sort((a, b) => b[1] - a[1]);

  useDebounce(
    () => {
      tagStore.fetchTags();
    },
    300,
    [memoList.size()],
  );

  const handleRebuildMemoTags = () => {
    showCommonDialog({
      title: "Rebuild tags",
      content: "It will rebuild tags for all memos, are you sure?",
      style: "warning",
      dialogName: "rebuild-memo-tags-dialog",
      onConfirm: async () => {
        await memoServiceClient.listMemoTags({
          parent: "memos/-",
          rebuild: true,
        });
        await tagStore.fetchTags({ skipCache: true });
        toast.success("Rebuild tags successfully");
      },
    });
  };

  return (
    <div className="flex flex-col justify-start items-start w-full mt-3 px-1 h-auto shrink-0 flex-nowrap hide-scrollbar">
      <div className="flex flex-row justify-between items-center w-full mb-1">
        <span className="text-sm leading-6 font-mono text-gray-400 select-none">{t("common.tags")}</span>
        <div>
          <Tooltip title={"Rebuild"} placement="top">
            <Icon.RefreshCcw className="text-gray-400 w-4 h-auto cursor-pointer hover:opacity-80" onClick={handleRebuildMemoTags} />
          </Tooltip>
        </div>
      </div>
      {tagAmounts.length > 0 ? (
        <div className="w-full flex flex-row justify-start items-center relative flex-wrap gap-1">
          {tagAmounts.map(([tag, amount]) => (
            <TagContainer key={tag} tag={tag} amount={amount} tagQuery={filter.tag} />
          ))}
        </div>
      ) : (
        <div className="p-2 border border-dashed rounded-md flex flex-row justify-start items-start gap-1 text-gray-400 dark:text-gray-500">
          <Icon.Tags />
          <p className="mt-0.5 text-sm leading-snug italic">{t("tag.create-tags-guide")}</p>
        </div>
      )}
    </div>
  );
};

interface TagContainerProps {
  tag: string;
  amount: number;
  tagQuery?: string;
}

const TagContainer: React.FC<TagContainerProps> = (props: TagContainerProps) => {
  const t = useTranslate();
  const filterStore = useFilterStore();
  const tagStore = useTagStore();
  const { tag, amount, tagQuery } = props;
  const isActive = tagQuery === tag;

  const handleTagClick = () => {
    if (isActive) {
      filterStore.setTagFilter(undefined);
    } else {
      filterStore.setTagFilter(tag);
    }
  };

  const handleDeleteTag = async () => {
    showCommonDialog({
      title: t("tag.delete-tag"),
      content: t("tag.delete-confirm"),
      style: "danger",
      dialogName: "delete-tag-dialog",
      onConfirm: async () => {
        await tagStore.deleteTag(tag);
        tagStore.fetchTags({ skipCache: true });
      },
    });
  };

  return (
    <div
      className={`shrink-0 w-auto max-w-full border text-sm rounded-md leading-6 flex flex-row justify-start items-center select-none hover:shadow-sm dark:hover:opacity-80 text-gray-600 dark:text-gray-400 dark:border-zinc-800 ${
        isActive && "bg-blue-50 dark:bg-zinc-800"
      }`}
    >
      <Dropdown>
        <MenuButton slots={{ root: "div" }}>
          <div className="shrink-0 group ml-1">
            <Icon.Hash className="group-hover:hidden w-4 h-auto shrink-0 opacity-60" />
            <Icon.MoreVertical className="hidden group-hover:block w-4 h-auto shrink-0 opacity-60" />
          </div>
        </MenuButton>
        <Menu size="sm" placement="bottom-start">
          <MenuItem onClick={() => showRenameTagDialog({ tag: tag })}>
            <Icon.Edit3 className="w-4 h-auto" />
            {t("common.rename")}
          </MenuItem>
          <MenuItem color="danger" onClick={handleDeleteTag}>
            <Icon.Trash className="w-4 h-auto" />
            {t("common.delete")}
          </MenuItem>
        </Menu>
      </Dropdown>
      <div className="inline-flex flex-nowrap pl-0.5 pr-1 gap-1 cursor-pointer max-w-[calc(100%-20px)]" onClick={handleTagClick}>
        <span className="truncate">{tag}</span>
        <span className="opacity-60 shrink-0">({amount})</span>
      </div>
    </div>
  );
};

export default TagsSection;
