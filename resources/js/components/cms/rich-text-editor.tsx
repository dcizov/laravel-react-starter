import Link from '@tiptap/extension-link';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Link2, List, ListOrdered } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { RichDoc } from '@/components/cms/rich-text';
import { docCharacters, EMPTY_DOC } from '@/components/cms/rich-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

const INACTIVE = {
    bold: false,
    italic: false,
    link: false,
    bulletList: false,
    orderedList: false,
};

// Rich text for paragraph, quote and list blocks. Only the formatting the public site can show is offered: bold,
// italic, links, and (in list blocks) bulleted and numbered lists. The server keeps the same set.
export default function RichTextEditor({
    id,
    label,
    value,
    onChange,
    mode = 'text',
    maxCharacters,
    error,
}: {
    id: string;
    label: string;
    value: RichDoc;
    onChange: (doc: RichDoc) => void;
    mode?: 'text' | 'list';
    maxCharacters: number;
    error?: string;
}) {
    const t = useTrans();
    const [count, setCount] = useState(() => docCharacters(value));

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                codeBlock: false,
                horizontalRule: false,
                strike: false,
                code: false,
                underline: false,
                blockquote: false,
                bulletList: mode === 'list' ? {} : false,
                orderedList: mode === 'list' ? {} : false,
                listItem: mode === 'list' ? {} : false,
                link: false,
            }),
            Link.configure({
                openOnClick: false,
                autolink: false,
                HTMLAttributes: { rel: 'noopener noreferrer nofollow' },
            }),
        ],
        content: value.content?.length ? value : EMPTY_DOC,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                id,
                role: 'textbox',
                'aria-multiline': 'true',
                'aria-label': label,
                class: cn(
                    'min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none',
                    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    '[&_a]:underline [&_a]:underline-offset-4 [&_ol]:list-decimal [&_p]:my-1 [&_ul]:list-disc [&_ul,&_ol]:ps-6',
                    error && 'border-destructive',
                ),
            },
        },
        onUpdate: ({ editor: current }) => {
            const doc = current.getJSON() as RichDoc;

            setCount(docCharacters(doc));
            onChange(doc);
        },
    });

    const state =
        useEditorState({
            editor,
            selector: ({ editor: current }) => ({
                bold: current?.isActive('bold') ?? false,
                italic: current?.isActive('italic') ?? false,
                link: current?.isActive('link') ?? false,
                bulletList: current?.isActive('bulletList') ?? false,
                orderedList: current?.isActive('orderedList') ?? false,
            }),
        }) ?? INACTIVE;

    const tooLong = count > maxCharacters;

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <div
                role="toolbar"
                aria-label={t('Formatting')}
                className="flex flex-wrap gap-1"
            >
                <ToolbarButton
                    label={t('Bold')}
                    pressed={state.bold}
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                >
                    <Bold />
                </ToolbarButton>
                <ToolbarButton
                    label={t('Italic')}
                    pressed={state.italic}
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                >
                    <Italic />
                </ToolbarButton>
                <LinkButton
                    active={state.link}
                    editor={editor}
                    label={t('Link')}
                />
                {mode === 'list' && (
                    <>
                        <ToolbarButton
                            label={t('Bulleted list')}
                            pressed={state.bulletList}
                            onClick={() =>
                                editor?.chain().focus().toggleBulletList().run()
                            }
                        >
                            <List />
                        </ToolbarButton>
                        <ToolbarButton
                            label={t('Numbered list')}
                            pressed={state.orderedList}
                            onClick={() =>
                                editor
                                    ?.chain()
                                    .focus()
                                    .toggleOrderedList()
                                    .run()
                            }
                        >
                            <ListOrdered />
                        </ToolbarButton>
                    </>
                )}
            </div>
            {editor && <EditorContent editor={editor} />}
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                    {t(':count of :max characters', {
                        count,
                        max: maxCharacters,
                    })}
                </span>
                {tooLong && (
                    <span className="text-destructive">
                        {t('The text is too long.')}
                    </span>
                )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function ToolbarButton({
    label,
    pressed,
    onClick,
    children,
}: {
    label: string;
    pressed: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <Button
            type="button"
            variant={pressed ? 'secondary' : 'ghost'}
            size="icon-sm"
            aria-label={label}
            aria-pressed={pressed}
            title={label}
            onClick={onClick}
        >
            {children}
        </Button>
    );
}

// The link button opens a small form for the address. Only http, https, paths on this site and anchors are accepted.
function LinkButton({
    active,
    editor,
    label,
}: {
    active: boolean;
    editor: Editor | null;
    label: string;
}) {
    const t = useTrans();
    const [open, setOpen] = useState(false);
    const [href, setHref] = useState('');
    const [invalid, setInvalid] = useState(false);

    const apply = () => {
        const trimmed = href.trim();

        if (trimmed === '') {
            editor?.chain().focus().unsetLink().run();
            setOpen(false);

            return;
        }

        if (
            !/^(https?:\/\/\S+|\/(?!\/)\S*|#[A-Za-z0-9_-]{0,80})$/i.test(
                trimmed,
            )
        ) {
            setInvalid(true);

            return;
        }

        editor
            ?.chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: trimmed })
            .run();
        setInvalid(false);
        setOpen(false);
    };

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (next) {
                    setHref(String(editor?.getAttributes('link').href ?? ''));
                    setInvalid(false);
                }
            }}
        >
            <PopoverTrigger
                render={
                    <Button
                        type="button"
                        variant={active ? 'secondary' : 'ghost'}
                        size="icon-sm"
                        aria-label={label}
                        aria-pressed={active}
                        title={label}
                    >
                        <Link2 />
                    </Button>
                }
            />
            <PopoverContent className="w-80" align="start">
                <form
                    className="grid gap-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        apply();
                    }}
                >
                    <div className="grid gap-2">
                        <Label htmlFor="rich-text-link-href">
                            {t('Link address')}
                        </Label>
                        <Input
                            id="rich-text-link-href"
                            value={href}
                            placeholder="https://"
                            aria-invalid={invalid}
                            onChange={(event) => setHref(event.target.value)}
                        />
                        {invalid && (
                            <p className="text-sm text-destructive">
                                {t(
                                    'Use a full http or https link, or a path starting with /.',
                                )}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                editor?.chain().focus().unsetLink().run();
                                setOpen(false);
                            }}
                        >
                            {t('Remove link')}
                        </Button>
                        <Button type="submit" size="sm">
                            {t('Apply link')}
                        </Button>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    );
}
