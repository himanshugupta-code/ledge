using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

public class ShelfCatch : MonoBehaviour
{
    enum State { Ready, Playing, Over }

    static readonly Color[] Spectrum =
    {
        new Color32(0xFF, 0x5A, 0x5F, 0xFF),
        new Color32(0xFF, 0x9A, 0x3C, 0xFF),
        new Color32(0xFF, 0xD4, 0x3B, 0xFF),
        new Color32(0x3D, 0xDC, 0x84, 0xFF),
        new Color32(0x2C, 0xD4, 0xE8, 0xFF),
        new Color32(0x5B, 0x7C, 0xFF, 0xFF),
    };

    static readonly Color Background = new Color32(0x0D, 0x0E, 0x14, 0xFF);
    static readonly Color Clutter = new Color32(0xE5, 0x48, 0x4D, 0xFF);
    const int StartingLives = 3;
    const string BestKey = "ledge.shelfcatch.best";

    class Faller
    {
        public Transform Body;
        public SpriteRenderer Renderer;
        public bool Bad;
        public Color Tint;
        public float Speed;
        public float Spin;
    }

    class Spark
    {
        public Transform Body;
        public SpriteRenderer Renderer;
        public Vector2 Velocity;
        public float Life;
    }

    Camera cam;
    Material spriteMaterial;
    Sprite[] cardSprites;
    Sprite clutterSprite;
    Sprite ledgeSprite;
    Sprite dotSprite;
    Transform ledge;
    SpriteRenderer ledgeGlow;
    Transform shelfRow;
    readonly List<Faller> fallers = new List<Faller>();
    readonly List<Spark> sparks = new List<Spark>();
    readonly List<Transform> shelved = new List<Transform>();

    Text scoreText;
    Text livesText;
    Text centerTitle;
    Text centerBody;
    Text comboText;
    AudioSource audioSource;
    AudioClip catchClip;
    AudioClip missClip;
    AudioClip clutterClip;

    State state = State.Ready;
    int score;
    int best;
    int lives;
    int combo;
    float elapsed;
    float spawnTimer;
    float ledgeX;
    float targetX;
    float shake;
    float halfWidth;
    float halfHeight;
    float comboFade;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (FindAnyObjectByType<ShelfCatch>() == null)
            new GameObject("Shelf Catch").AddComponent<ShelfCatch>();
    }

    void Awake()
    {
        Application.targetFrameRate = 60;
        best = PlayerPrefs.GetInt(BestKey, 0);
        spriteMaterial = new Material(Shader.Find("Sprites/Default"));
        cardSprites = new Sprite[Spectrum.Length];
        for (int i = 0; i < Spectrum.Length; i++) cardSprites[i] = MakeCardSprite(Spectrum[i]);
        clutterSprite = MakeClutterSprite();
        ledgeSprite = MakeRoundedSprite(256, 32, 16, Color.white);
        dotSprite = MakeRoundedSprite(16, 16, 8, Color.white);
        SetUpCamera();
        SetUpWorld();
        SetUpUi();
        SetUpAudio();
        ShowReady();
    }

    void SetUpCamera()
    {
        cam = Camera.main;
        if (cam == null)
        {
            cam = new GameObject("Main Camera").AddComponent<Camera>();
            cam.tag = "MainCamera";
        }
        cam.orthographic = true;
        cam.orthographicSize = 5f;
        cam.clearFlags = CameraClearFlags.SolidColor;
        cam.backgroundColor = Background;
        cam.transform.position = new Vector3(0, 0, -10);
        UpdateBounds();
    }

    void UpdateBounds()
    {
        halfHeight = cam.orthographicSize;
        halfWidth = halfHeight * cam.aspect;
    }

    void SetUpWorld()
    {
        var grid = new GameObject("Grid").transform;
        for (int x = -12; x <= 12; x++)
        {
            for (int y = -6; y <= 6; y++)
            {
                var dot = MakeSprite("Dot", dotSprite, new Color(1, 1, 1, 0.05f), grid);
                dot.localPosition = new Vector3(x * 0.8f, y * 0.8f, 1);
                dot.localScale = Vector3.one * 0.12f;
            }
        }

        var top = MakeSprite("Top Shelf", ledgeSprite, new Color(0.56f, 0.64f, 1f, 0.35f), null);
        top.localScale = new Vector3(40, 0.3f, 1);
        top.position = new Vector3(0, 3.6f, 0);
        shelfRow = new GameObject("Shelf Row").transform;

        ledge = MakeSprite("Ledge", ledgeSprite, new Color(0.93f, 0.95f, 1f), null);
        ledge.localScale = new Vector3(2.6f, 2.2f, 1);
        ledge.position = new Vector3(0, -4.1f, 0);
        var glow = MakeSprite("Glow", ledgeSprite, new Color(0.36f, 0.49f, 1f, 0.45f), ledge);
        glow.localScale = new Vector3(1.1f, 2.4f, 1);
        glow.localPosition = new Vector3(0, 0, 0.1f);
        ledgeGlow = glow.GetComponent<SpriteRenderer>();
    }

    void SetUpUi()
    {
        var canvasGo = new GameObject("UI", typeof(Canvas), typeof(CanvasScaler));
        var canvas = canvasGo.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        var scaler = canvasGo.GetComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1280, 720);
        scaler.matchWidthOrHeight = 0.5f;

        var font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        scoreText = MakeText(canvas.transform, font, 34, TextAnchor.UpperLeft, new Vector2(0, 1), new Vector2(28, -22));
        livesText = MakeText(canvas.transform, font, 34, TextAnchor.UpperRight, new Vector2(1, 1), new Vector2(-28, -22));
        centerTitle = MakeText(canvas.transform, font, 64, TextAnchor.MiddleCenter, new Vector2(0.5f, 0.5f), new Vector2(0, 60));
        centerBody = MakeText(canvas.transform, font, 26, TextAnchor.MiddleCenter, new Vector2(0.5f, 0.5f), new Vector2(0, -20));
        comboText = MakeText(canvas.transform, font, 40, TextAnchor.MiddleCenter, new Vector2(0.5f, 0.5f), new Vector2(0, 160));
        centerTitle.fontStyle = FontStyle.Bold;
        comboText.fontStyle = FontStyle.Bold;
    }

    Text MakeText(Transform parent, Font font, int size, TextAnchor anchor, Vector2 pivot, Vector2 offset)
    {
        var go = new GameObject("Text", typeof(RectTransform), typeof(Text));
        go.transform.SetParent(parent, false);
        var rect = go.GetComponent<RectTransform>();
        rect.anchorMin = pivot;
        rect.anchorMax = pivot;
        rect.pivot = pivot;
        rect.anchoredPosition = offset;
        rect.sizeDelta = new Vector2(1100, size * 2.2f);
        var text = go.GetComponent<Text>();
        text.font = font;
        text.fontSize = size;
        text.alignment = anchor;
        text.color = new Color(0.95f, 0.95f, 0.98f);
        text.horizontalOverflow = HorizontalWrapMode.Wrap;
        text.verticalOverflow = VerticalWrapMode.Overflow;
        return text;
    }

    void SetUpAudio()
    {
        audioSource = gameObject.AddComponent<AudioSource>();
        audioSource.playOnAwake = false;
        catchClip = MakeTone("catch", 880f, 1320f, 0.09f, 0.35f);
        missClip = MakeTone("miss", 220f, 110f, 0.22f, 0.4f);
        clutterClip = MakeTone("clutter", 160f, 90f, 0.28f, 0.45f);
    }

    static AudioClip MakeTone(string name, float from, float to, float seconds, float volume)
    {
        const int rate = 44100;
        int samples = Mathf.CeilToInt(rate * seconds);
        var data = new float[samples];
        float phase = 0;
        for (int i = 0; i < samples; i++)
        {
            float t = (float)i / samples;
            phase += 2 * Mathf.PI * Mathf.Lerp(from, to, t) / rate;
            data[i] = Mathf.Sin(phase) * volume * (1 - t) * Mathf.Min(1, i / 200f);
        }
        var clip = AudioClip.Create(name, samples, 1, rate, false);
        clip.SetData(data, 0);
        return clip;
    }

    void ShowReady()
    {
        state = State.Ready;
        centerTitle.text = "Shelf Catch";
        centerBody.text = "Catch every screenshot on the ledge. Dodge the red Desktop clutter.\nMove with your mouse, a finger or the arrow keys. Click or tap to start.";
        UpdateHud();
    }

    void StartGame()
    {
        foreach (var f in fallers) Destroy(f.Body.gameObject);
        fallers.Clear();
        foreach (var s in shelved) Destroy(s.gameObject);
        shelved.Clear();
        score = 0;
        combo = 0;
        lives = StartingLives;
        elapsed = 0;
        spawnTimer = 0.4f;
        state = State.Playing;
        centerTitle.text = "";
        centerBody.text = "";
        UpdateHud();
    }

    void EndGame()
    {
        state = State.Over;
        foreach (var f in fallers)
        {
            Burst(f.Body.position, f.Tint, 6);
            Destroy(f.Body.gameObject);
        }
        fallers.Clear();
        if (score > best)
        {
            best = score;
            PlayerPrefs.SetInt(BestKey, best);
            PlayerPrefs.Save();
        }
        centerTitle.text = score >= best && score > 0 ? "New best!" : "Shelf full of gaps";
        centerBody.text = $"You caught {score} screenshot{(score == 1 ? "" : "s")}. Best: {best}.\nClick or tap to play again.";
        UpdateHud();
    }

    void UpdateHud()
    {
        scoreText.text = $"CAUGHT  {score}      BEST  {best}";
        livesText.text = state == State.Ready ? "" : $"LIVES  {Mathf.Max(0, lives)}";
    }

    void Update()
    {
        UpdateBounds();
        float dt = Mathf.Min(Time.deltaTime, 1 / 30f);
        ReadInput(out bool pressed, out float pointerX, out float keyAxis);

        if (state != State.Playing && pressed) StartGame();

        if (!float.IsNaN(pointerX)) targetX = pointerX;
        targetX += keyAxis * 11f * dt;
        float limit = halfWidth - ledge.localScale.x * 0.5f;
        targetX = Mathf.Clamp(targetX, -limit, limit);
        ledgeX = Mathf.Lerp(ledgeX, targetX, 1 - Mathf.Exp(-18f * dt));
        ledge.position = new Vector3(ledgeX, -4.1f, 0);
        ledge.rotation = Quaternion.Euler(0, 0, Mathf.Clamp((targetX - ledgeX) * -4f, -8f, 8f));
        ledgeGlow.color = new Color(0.36f, 0.49f, 1f, 0.35f + 0.15f * Mathf.Sin(Time.time * 3f));

        if (state == State.Playing)
        {
            elapsed += dt;
            spawnTimer -= dt;
            if (spawnTimer <= 0)
            {
                Spawn();
                spawnTimer = Mathf.Max(0.32f, 1.05f - elapsed * 0.012f) * Random.Range(0.75f, 1.2f);
            }
            MoveFallers(dt);
        }

        MoveSparks(dt);
        if (comboFade > 0)
        {
            comboFade -= dt;
            comboText.color = new Color(1f, 0.83f, 0.23f, Mathf.Clamp01(comboFade * 2));
        }

        shake = Mathf.Max(0, shake - dt * 3f);
        cam.transform.position = new Vector3(Random.Range(-1f, 1f) * shake * 0.25f, Random.Range(-1f, 1f) * shake * 0.25f, -10);
    }

    void ReadInput(out bool pressed, out float pointerX, out float keyAxis)
    {
        pressed = false;
        pointerX = float.NaN;
        keyAxis = 0;
#if ENABLE_INPUT_SYSTEM
        var mouse = Mouse.current;
        var touch = Touchscreen.current;
        var keyboard = Keyboard.current;
        Vector2? screen = null;
        if (touch != null && touch.primaryTouch.press.isPressed)
        {
            screen = touch.primaryTouch.position.ReadValue();
            if (touch.primaryTouch.press.wasPressedThisFrame) pressed = true;
        }
        else if (mouse != null)
        {
            if (mouse.delta.ReadValue().sqrMagnitude > 0.01f || mouse.leftButton.isPressed) screen = mouse.position.ReadValue();
            if (mouse.leftButton.wasPressedThisFrame) pressed = true;
        }
        if (keyboard != null)
        {
            if (keyboard.leftArrowKey.isPressed || keyboard.aKey.isPressed) keyAxis -= 1;
            if (keyboard.rightArrowKey.isPressed || keyboard.dKey.isPressed) keyAxis += 1;
            if (keyboard.spaceKey.wasPressedThisFrame || keyboard.enterKey.wasPressedThisFrame) pressed = true;
        }
        if (screen.HasValue) pointerX = cam.ScreenToWorldPoint(new Vector3(screen.Value.x, screen.Value.y, 10)).x;
#else
        if (Input.touchCount > 0)
        {
            var t = Input.GetTouch(0);
            pointerX = cam.ScreenToWorldPoint(new Vector3(t.position.x, t.position.y, 10)).x;
            if (t.phase == TouchPhase.Began) pressed = true;
        }
        else
        {
            if (Mathf.Abs(Input.GetAxisRaw("Mouse X")) > 0.001f || Input.GetMouseButton(0)) pointerX = cam.ScreenToWorldPoint(Input.mousePosition + Vector3.forward * 10).x;
            if (Input.GetMouseButtonDown(0)) pressed = true;
        }
        keyAxis = Input.GetAxisRaw("Horizontal");
        if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.Return)) pressed = true;
#endif
    }

    void Spawn()
    {
        bool bad = elapsed > 4f && Random.value < Mathf.Min(0.32f, 0.12f + elapsed * 0.004f);
        int pick = Random.Range(0, Spectrum.Length);
        var color = bad ? Clutter : Spectrum[pick];
        var body = MakeSprite(bad ? "Clutter" : "Screenshot", bad ? clutterSprite : cardSprites[pick], Color.white, null);
        var renderer = body.GetComponent<SpriteRenderer>();
        body.localScale = Vector3.one * (bad ? 0.9f : 1f);
        float x = Random.Range(-halfWidth + 1f, halfWidth - 1f);
        body.position = new Vector3(x, halfHeight + 1f, 0);
        body.rotation = Quaternion.Euler(0, 0, Random.Range(-18f, 18f));
        fallers.Add(new Faller
        {
            Body = body,
            Renderer = renderer,
            Bad = bad,
            Tint = color,
            Speed = Random.Range(2.6f, 3.4f) + elapsed * 0.05f,
            Spin = Random.Range(-60f, 60f),
        });
    }

    void MoveFallers(float dt)
    {
        float catchY = -3.55f;
        float halfLedge = ledge.localScale.x * 0.5f + 0.25f;
        for (int i = fallers.Count - 1; i >= 0; i--)
        {
            var f = fallers[i];
            var p = f.Body.position;
            p.y -= f.Speed * dt;
            f.Body.position = p;
            f.Body.Rotate(0, 0, f.Spin * dt);

            if (p.y <= catchY && p.y > catchY - 0.5f && Mathf.Abs(p.x - ledgeX) <= halfLedge)
            {
                fallers.RemoveAt(i);
                if (f.Bad) HitClutter(f);
                else Catch(f);
                continue;
            }
            if (p.y < -halfHeight - 1f)
            {
                fallers.RemoveAt(i);
                if (!f.Bad) Miss(f);
                Destroy(f.Body.gameObject);
            }
        }
    }

    void Catch(Faller f)
    {
        score++;
        combo++;
        Burst(f.Body.position, f.Tint, 14);
        audioSource.pitch = 1f + Mathf.Min(combo, 10) * 0.04f;
        audioSource.PlayOneShot(catchClip);
        if (combo > 0 && combo % 5 == 0)
        {
            comboText.text = $"{combo} in a row!";
            comboFade = 1.4f;
        }
        Shelve(f.Body);
        UpdateHud();
    }

    void Shelve(Transform card)
    {
        card.SetParent(shelfRow, true);
        card.rotation = Quaternion.identity;
        card.localScale = Vector3.one * 0.42f;
        shelved.Insert(0, card);
        int max = Mathf.FloorToInt(halfWidth * 2 / 0.62f);
        while (shelved.Count > max)
        {
            var last = shelved[shelved.Count - 1];
            shelved.RemoveAt(shelved.Count - 1);
            Destroy(last.gameObject);
        }
        for (int i = 0; i < shelved.Count; i++)
            shelved[i].position = new Vector3(-halfWidth + 0.4f + i * 0.62f, 3.82f, 0);
    }

    void Miss(Faller f)
    {
        combo = 0;
        lives--;
        shake = 1f;
        audioSource.pitch = 1f;
        audioSource.PlayOneShot(missClip);
        Burst(new Vector3(f.Body.position.x, -halfHeight + 0.2f, 0), new Color(1, 1, 1, 0.6f), 8);
        UpdateHud();
        if (lives <= 0) EndGame();
    }

    void HitClutter(Faller f)
    {
        combo = 0;
        lives--;
        shake = 1.4f;
        audioSource.pitch = 1f;
        audioSource.PlayOneShot(clutterClip);
        Burst(f.Body.position, Clutter, 22);
        Destroy(f.Body.gameObject);
        UpdateHud();
        if (lives <= 0) EndGame();
    }

    void Burst(Vector3 at, Color color, int count)
    {
        for (int i = 0; i < count; i++)
        {
            var body = MakeSprite("Spark", dotSprite, color, null);
            body.position = at;
            body.localScale = Vector3.one * Random.Range(0.07f, 0.15f);
            var angle = Random.Range(0f, Mathf.PI * 2);
            sparks.Add(new Spark
            {
                Body = body,
                Renderer = body.GetComponent<SpriteRenderer>(),
                Velocity = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle) + 0.6f) * Random.Range(2f, 5f),
                Life = Random.Range(0.4f, 0.8f),
            });
        }
    }

    void MoveSparks(float dt)
    {
        for (int i = sparks.Count - 1; i >= 0; i--)
        {
            var s = sparks[i];
            s.Life -= dt;
            if (s.Life <= 0)
            {
                Destroy(s.Body.gameObject);
                sparks.RemoveAt(i);
                continue;
            }
            s.Velocity += Vector2.down * 9f * dt;
            s.Body.position += (Vector3)(s.Velocity * dt);
            var c = s.Renderer.color;
            c.a = Mathf.Clamp01(s.Life * 2);
            s.Renderer.color = c;
        }
    }

    Transform MakeSprite(string name, Sprite sprite, Color color, Transform parent)
    {
        var go = new GameObject(name);
        var renderer = go.AddComponent<SpriteRenderer>();
        renderer.sprite = sprite;
        renderer.color = color;
        renderer.sharedMaterial = spriteMaterial;
        if (parent != null) go.transform.SetParent(parent, false);
        return go.transform;
    }

    static Sprite MakeRoundedSprite(int width, int height, int radius, Color color)
    {
        var tex = new Texture2D(width, height, TextureFormat.RGBA32, false) { filterMode = FilterMode.Bilinear, wrapMode = TextureWrapMode.Clamp };
        var pixels = new Color[width * height];
        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                float a = RoundedAlpha(x, y, width, height, radius);
                pixels[y * width + x] = new Color(color.r, color.g, color.b, a);
            }
        }
        tex.SetPixels(pixels);
        tex.Apply();
        return Sprite.Create(tex, new Rect(0, 0, width, height), new Vector2(0.5f, 0.5f), Mathf.Max(width, height));
    }

    static float RoundedAlpha(int x, int y, int w, int h, int r)
    {
        float cx = Mathf.Clamp(x + 0.5f, r, w - r);
        float cy = Mathf.Clamp(y + 0.5f, r, h - r);
        float d = Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f), new Vector2(cx, cy));
        return Mathf.Clamp01(r - d + 0.5f);
    }

    static Sprite MakeCardSprite(Color stripe)
    {
        const int w = 160, h = 100, r = 12;
        var tex = new Texture2D(w, h, TextureFormat.RGBA32, false) { filterMode = FilterMode.Bilinear, wrapMode = TextureWrapMode.Clamp };
        var px = new Color[w * h];
        var paper = new Color(0.94f, 0.95f, 0.99f);
        var line = new Color(0.62f, 0.66f, 0.78f);
        var lineLight = new Color(0.78f, 0.81f, 0.88f);
        for (int y = 0; y < h; y++)
        {
            for (int x = 0; x < w; x++)
            {
                var c = x < 34 ? stripe : paper;
                if (y > 66 && y < 74 && x > 48 && x < 132) c = line;
                if (y > 50 && y < 56 && x > 48 && x < 112) c = lineLight;
                if (y > 36 && y < 42 && x > 48 && x < 124) c = lineLight;
                c.a = RoundedAlpha(x, y, w, h, r);
                px[y * w + x] = c;
            }
        }
        tex.SetPixels(px);
        tex.Apply();
        return Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 120);
    }

    static Sprite MakeClutterSprite()
    {
        const int s = 112, r = 18;
        var tex = new Texture2D(s, s, TextureFormat.RGBA32, false) { filterMode = FilterMode.Bilinear, wrapMode = TextureWrapMode.Clamp };
        var px = new Color[s * s];
        for (int y = 0; y < s; y++)
        {
            for (int x = 0; x < s; x++)
            {
                var c = Clutter;
                float u = x - s / 2f, v = y - s / 2f;
                bool cross = (Mathf.Abs(u - v) < 7 || Mathf.Abs(u + v) < 7) && Mathf.Abs(u) < 26 && Mathf.Abs(v) < 26;
                if (cross) c = Color.white;
                c.a = RoundedAlpha(x, y, s, s, r);
                px[y * s + x] = c;
            }
        }
        tex.SetPixels(px);
        tex.Apply();
        return Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.5f), 120);
    }
}
